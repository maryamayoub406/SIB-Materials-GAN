"""
ML Property Predictor
Wraps existing trained models (model_bandgap.pkl, model_density.pkl, model_stability.pkl)
and adds extended property computation + SHAP explainability.
"""
import os
import json
import numpy as np
import joblib
import shap
from pathlib import Path

import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # FYP/
load_dotenv(BASE_DIR / "backend" / ".env")

MODEL_DIR = Path(os.getenv("MODEL_DIR", BASE_DIR / "Models")).resolve()
UTILS_DIR = Path(os.getenv("UTILS_DIR", BASE_DIR / "Utils")).resolve()


def _load_models():
    """Load all three sklearn models and element mappings."""
    model_bg = joblib.load(MODEL_DIR / "model_bandgap.pkl")
    model_dens = joblib.load(MODEL_DIR / "model_density.pkl")
    model_stab = joblib.load(MODEL_DIR / "model_stability.pkl")
    with open(UTILS_DIR / "element_mappings.json") as f:
        mappings = json.load(f)
    return model_bg, model_dens, model_stab, mappings


# Module-level singletons (lazy load on first use)
_model_bg = None
_model_dens = None
_model_stab = None
_mappings = None
_explainer_bg = None


def get_models():
    global _model_bg, _model_dens, _model_stab, _mappings
    if _model_bg is None:
        _model_bg, _model_dens, _model_stab, _mappings = _load_models()
    return _model_bg, _model_dens, _model_stab, _mappings


def get_shap_explainer():
    global _explainer_bg
    if _explainer_bg is None:
        model_bg, _, _, _ = get_models()
        # Use TreeExplainer for RandomForest/GradientBoosting
        _explainer_bg = shap.TreeExplainer(model_bg)
    return _explainer_bg


# ----------------------------------------------------------------
# Utility: composition string → element dict
# ----------------------------------------------------------------
_PERIODIC = [
    "H","He","Li","Be","B","C","N","O","F","Ne",
    "Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca",
    "Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn",
    "Ga","Ge","As","Se","Br","Kr","Rb","Sr","Y","Zr",
    "Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn",
    "Sb","Te","I","Xe","Cs","Ba","La","Ce","Pr","Nd",
    "Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb",
    "Lu","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg",
    "Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th",
    "Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm",
    "Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt","Ds",
    "Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og",
]

ELECTRONEGATIVITY = {
    "Na": 0.93, "Fe": 1.83, "Mn": 1.55, "Co": 1.88, "Ni": 1.91,
    "V": 1.63, "O": 3.44, "P": 2.19, "S": 2.58, "F": 3.98,
    "Ti": 1.54, "Al": 1.61, "Zr": 1.33, "Nb": 1.6, "Cr": 1.66,
    "Cu": 1.90, "Li": 0.98, "K": 0.82, "Ca": 1.00,
}
VALENCE = {
    "Na": 1, "Fe": 3, "Mn": 4, "Co": 3, "Ni": 2,
    "V": 5, "O": -2, "P": 5, "S": 6, "F": -1,
    "Ti": 4, "Al": 3, "Zr": 4, "Nb": 5, "Cr": 3,
}


def parse_formula(formula: str) -> dict:
    """
    Very simple formula parser: extracts {element: fraction}.
    Handles NaFeO2, Na2MnO3, NaFe0.5Mn0.5O2 etc.
    """
    import re
    pattern = re.compile(r'([A-Z][a-z]?)(\d*\.?\d*)')
    matches = pattern.findall(formula)
    comp = {}
    total = 0.0
    for elem, cnt in matches:
        if elem not in _PERIODIC:
            continue
        c = float(cnt) if cnt else 1.0
        comp[elem] = comp.get(elem, 0.0) + c
        total += c
    if total > 0:
        comp = {k: v / total for k, v in comp.items()}
    return comp


def composition_to_vector(composition: dict, mappings: dict) -> np.ndarray:
    """Convert element:fraction dict to 72-dim feature vector."""
    vec = np.zeros(62)
    for elem, frac in composition.items():
        if elem in mappings.get("element_to_idx", {}):
            idx = mappings["element_to_idx"][elem]
            if idx < 62:
                vec[idx] = frac

    # 10 chemical descriptor features
    elements = list(composition.keys())
    fractions = list(composition.values())

    # 1. Mean electronegativity
    en_vals = [ELECTRONEGATIVITY.get(e, 2.0) for e in elements]
    mean_en = np.average(en_vals, weights=fractions) if fractions else 2.0

    # 2. Electronegativity variance
    var_en = np.average([(e - mean_en) ** 2 for e in en_vals], weights=fractions) if fractions else 0.0

    # 3. Number of elements
    n_elem = float(len(elements))

    # 4. Na fraction
    na_frac = composition.get("Na", 0.0)

    # 5. O fraction
    o_frac = composition.get("O", 0.0)

    # 6. Transition metal fraction (Fe, Mn, Co, Ni, V, Ti, Cr, Nb, Zr)
    TM = {"Fe", "Mn", "Co", "Ni", "V", "Ti", "Cr", "Nb", "Zr", "Cu"}
    tm_frac = sum(composition.get(e, 0.0) for e in TM)

    # 7. Valence balance check
    val_sum = sum(VALENCE.get(e, 0) * f for e, f in composition.items())
    val_balance = abs(val_sum)

    # 8. P fraction (phosphate materials)
    p_frac = composition.get("P", 0.0)

    # 9. F fraction (fluorination)
    f_frac = composition.get("F", 0.0)

    # 10. S fraction (sulfate/sulfide)
    s_frac = composition.get("S", 0.0)

    chem_features = np.array([
        mean_en, var_en, n_elem, na_frac, o_frac,
        tm_frac, val_balance, p_frac, f_frac, s_frac
    ])

    return np.concatenate([vec, chem_features])


# ----------------------------------------------------------------
# Derived property estimators (SIB domain knowledge)
# ----------------------------------------------------------------
def estimate_voltage(composition: dict, band_gap: float) -> float:
    """Estimate operating voltage based on composition and band gap."""
    base = 3.5
    # NASICON-type (has P and V)
    if "P" in composition and "V" in composition:
        base = 3.7
    # Layered oxide
    elif "O" in composition and ("Mn" in composition or "Fe" in composition):
        base = 3.2 + composition.get("Mn", 0.0) * 0.5
    # Fluoride-based
    elif "F" in composition:
        base = 3.9
    # Adjust for band gap
    base -= band_gap * 0.15
    return float(np.clip(base, 2.0, 4.5))


def estimate_specific_capacity(composition: dict, density: float) -> float:
    """Estimate specific capacity (mAh/g)."""
    # Faraday approach: assume 1 Na per formula unit
    # molecular weight estimation from composition
    ATOMIC_MASS = {
        "Na": 22.99, "Fe": 55.85, "Mn": 54.94, "Co": 58.93,
        "Ni": 58.69, "V": 50.94, "O": 16.00, "P": 30.97,
        "S": 32.06, "F": 19.00, "Ti": 47.87, "Al": 26.98,
        "Cr": 52.00, "Zr": 91.22, "Nb": 92.91, "Li": 6.94,
        "Cu": 63.55, "Mg": 24.31, "Ca": 40.08, "K": 39.10,
        "C": 12.01, "N": 14.01, "Si": 28.09,
    }
    mw = sum(ATOMIC_MASS.get(e, 40.0) * f for e, f in composition.items())
    na_frac = composition.get("Na", 0.1)
    # Capacity ≈ (F × x_Na) / M_formula × 1000 / 3600
    # F = 96485 C/mol, use x_Na as Na count
    x_na = max(na_frac * 4, 0.5)  # approximate Na count
    capacity = (96485 * x_na) / (mw / na_frac * 3.6)
    return float(np.clip(capacity, 50.0, 350.0))


def _deterministic_seed(formula: str) -> float:
    import hashlib
    h = hashlib.md5(formula.encode('utf-8')).hexdigest()
    return int(h, 16) / (16**32)

def estimate_ionic_conductivity(composition: dict, formula_seed: float = 0.5) -> float:
    """Estimate ionic conductivity (S/cm)."""
    # NASICON-type materials have very high ionic conductivity
    if "P" in composition and ("V" in composition or "Ti" in composition):
        return float(1e-3 + formula_seed * (1e-2 - 1e-3))
    # Layered oxides
    elif "O" in composition:
        return float(1e-4 + formula_seed * (1e-3 - 1e-4))
    else:
        return float(1e-6 + formula_seed * (1e-4 - 1e-6))


def estimate_na_diffusion_barrier(composition: dict, stability: float, formula_seed: float = 0.5) -> float:
    """Estimate Na diffusion barrier (eV)."""
    base = 0.3
    # Lower barrier in NASICON-type
    if "P" in composition:
        base = 0.2
    elif "Mn" in composition:
        base = 0.35
    # Higher barrier for less stable materials
    base += stability * 0.5
    diff = (formula_seed - 0.5) * 0.1 # bounded pseudo-random difference
    return float(np.clip(base + diff, 0.1, 1.0))


def estimate_cycle_life(stability: float, formula_seed: float = 0.5, capacity_retention_target: float = 0.8) -> int:
    """Estimate cycle life (number of cycles to 80% retention)."""
    if stability < 0.02:
        return int(1500 + formula_seed * (3000 - 1500))
    elif stability < 0.05:
        return int(800 + formula_seed * (1500 - 800))
    elif stability < 0.1:
        return int(300 + formula_seed * (800 - 300))
    else:
        return int(100 + formula_seed * (300 - 100))


def compute_performance_score(
    energy_density: float,
    stability: float,
    cycle_life: int,
    ionic_conductivity: float,
) -> float:
    """Composite 0-100 performance score."""
    # Normalize each dimension
    e_score = min(energy_density / 1000.0, 1.0) * 40  # weight 40%
    s_score = max(0, (0.1 - stability) / 0.1) * 25    # weight 25% (lower better)
    c_score = min(cycle_life / 2000.0, 1.0) * 20       # weight 20%
    i_score = min(np.log10(max(ionic_conductivity, 1e-8) + 1e-8) / 2.0 + 1, 1.0) * 15  # 15%
    return float(np.clip(e_score + s_score + c_score + i_score, 0, 100))


# ----------------------------------------------------------------
# VALIDATION
# ----------------------------------------------------------------
def validate_material(composition: dict, formation_energy: float) -> dict:
    """Run scientific validity checks."""
    results = {}

    # 1. Formation energy < 0 for thermodynamic stability
    results["formation_energy_ok"] = formation_energy < 0

    # 2. Charge neutrality (approximate)
    val_sum = sum(VALENCE.get(e, 0) * f * 10 for e, f in composition.items())
    results["charge_neutral"] = abs(val_sum) <= 3.8

    # 3. Chemical validity: must contain Na
    results["chemical_validity"] = "Na" in composition and composition.get("Na", 0) > 0.05

    # 4. Structural feasibility: not too many elements
    results["structural_feasibility"] = len(composition) <= 6

    results["passed"] = all(results.values())
    return results


# ----------------------------------------------------------------
# SHAP EXPLANATION
# ----------------------------------------------------------------
def get_shap_explanation(features: np.ndarray, composition: dict) -> list:
    """Return top-k SHAP values for the band_gap model."""
    explainer = get_shap_explainer()
    shap_vals = explainer.shap_values(features.reshape(1, -1))
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[0]
    shap_vals = shap_vals.flatten()

    _, _, _, mappings = get_models()
    idx_to_elem = {v: k for k, v in mappings.get("element_to_idx", {}).items()}

    results = []
    for i, sv in enumerate(shap_vals[:62]):
        elem = idx_to_elem.get(i, f"feat_{i}")
        results.append({
            "element": elem,
            "shap_value": float(sv),
            "contribution": "positive" if sv > 0 else "negative"
        })

    # Keep only elements present in composition + top-5 others
    present = [r for r in results if r["element"] in composition]
    absent = sorted(
        [r for r in results if r["element"] not in composition],
        key=lambda x: abs(x["shap_value"]),
        reverse=True
    )[:5]
    combined = present + absent
    combined.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    return combined[:10]


def build_explanation_text(
    formula: str,
    energy_density: float,
    stability: float,
    band_gap: float,
    cycle_life: int,
    validation: dict,
) -> str:
    """Generate human-readable explanation."""
    lines = [f"Material Analysis: {formula}"]

    # Energy density assessment
    if energy_density > 500:
        lines.append(f"✅ Excellent energy density ({energy_density:.0f} Wh/kg) — {energy_density/175:.1f}× commercial SIB.")
    elif energy_density > 250:
        lines.append(f"🟡 Moderate energy density ({energy_density:.0f} Wh/kg) — competitive with current SIBs.")
    else:
        lines.append(f"❌ Low energy density ({energy_density:.0f} Wh/kg) — below commercial threshold.")

    # Stability
    if stability < 0.02:
        lines.append(f"✅ Very high structural stability (Δ_hull = {stability:.4f} eV/atom).")
    elif stability < 0.1:
        lines.append(f"🟡 Acceptable stability (Δ_hull = {stability:.4f} eV/atom) — may require doping.")
    else:
        lines.append(f"❌ Poor stability (Δ_hull = {stability:.4f} eV/atom) — not thermodynamically stable.")

    # Band gap
    if band_gap < 1.0:
        lines.append(f"✅ Low band gap ({band_gap:.2f} eV) — good electronic conductivity.")
    elif band_gap < 3.0:
        lines.append(f"🟡 Moderate band gap ({band_gap:.2f} eV) — may need conductive coating.")
    else:
        lines.append(f"❌ Wide band gap ({band_gap:.2f} eV) — poor intrinsic conductivity.")

    # Cycle life
    lines.append(f"🔋 Predicted cycle life: {cycle_life} cycles (to 80% retention).")

    # Validation
    if validation.get("passed"):
        lines.append("✅ Passed all scientific validity checks.")
    else:
        failed = [k for k, v in validation.items() if not v and k != "passed"]
        lines.append(f"⚠️ Failed validity checks: {', '.join(failed)}.")

    return " | ".join(lines)


# ----------------------------------------------------------------
# MAIN PREDICT FUNCTION
# ----------------------------------------------------------------
def predict_properties(formula: str, composition: dict = None) -> dict:
    """
    Full property prediction pipeline.
    Returns a dict matching PredictionResponse schema.
    """
    model_bg, model_dens, model_stab, mappings = get_models()

    if composition is None:
        composition = parse_formula(formula)

    if not composition:
        raise ValueError(f"Could not parse formula: {formula}")

    # Build feature vector
    features = composition_to_vector(composition, mappings)

    # Core ML predictions
    pred_bg = float(model_bg.predict(features.reshape(1, -1))[0])
    pred_dens = float(model_dens.predict(features.reshape(1, -1))[0])
    pred_stab = float(model_stab.predict(features.reshape(1, -1))[0])

    # Calculate deterministic seed for reproducible properties
    formula_seed = _deterministic_seed(formula)

    # Derived properties
    voltage = estimate_voltage(composition, pred_bg)
    capacity = estimate_specific_capacity(composition, pred_dens)
    energy_density = voltage * capacity * pred_dens / 3.6  # simplified
    energy_density = float(np.clip(energy_density, 50, 1200))
    ionic_cond = estimate_ionic_conductivity(composition, formula_seed)
    na_barrier = estimate_na_diffusion_barrier(composition, pred_stab, formula_seed)
    cycle_life = estimate_cycle_life(pred_stab, formula_seed)
    capacity_retention = float(np.clip(0.95 - pred_stab * 2, 0.5, 0.99))
    
    diff_form = (formula_seed - 0.5) * 0.2
    formation_energy = float(-1.5 + pred_stab * 3 + diff_form)

    # Validation
    validation = validate_material(composition, formation_energy)

    # SHAP
    try:
        shap_values = get_shap_explanation(features, composition)
    except Exception:
        shap_values = []

    # Explanation
    explanation = build_explanation_text(
        formula, energy_density, pred_stab, pred_bg, cycle_life, validation
    )

    # Performance score
    score = compute_performance_score(energy_density, pred_stab, cycle_life, ionic_cond)

    return {
        "formula": formula,
        "specific_capacity": round(capacity, 2),
        "voltage": round(voltage, 3),
        "energy_density": round(energy_density, 2),
        "formation_energy": round(formation_energy, 4),
        "ionic_conductivity": round(ionic_cond, 6),
        "na_diffusion_barrier": round(na_barrier, 4),
        "structural_stability": round(pred_stab, 4),
        "band_gap": round(pred_bg, 4),
        "density": round(pred_dens, 3),
        "cycle_life": cycle_life,
        "capacity_retention": round(capacity_retention, 4),
        "validation": validation,
        "shap_values": shap_values,
        "explanation": explanation,
        "performance_score": round(score, 2),
    }
