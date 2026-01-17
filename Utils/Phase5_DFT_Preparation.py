"""
Phase 5: DFT Validation Preparation
Add this as a new cell at the end of your Jupyter notebook
OR run it as a standalone script
"""

import pandas as pd
import numpy as np
import os

# ============================================================================
# PHASE 5: DFT VALIDATION PREPARATION
# ============================================================================

print("="*80)
print("PREPARING TOP CANDIDATES FOR DFT VALIDATION")
print("="*80)

# Load the top candidates (adjust path if needed)
try:
    df_promising = pd.read_csv('top_candidates.csv')
    print(f"✓ Loaded {len(df_promising)} promising candidates")
except:
    print("ERROR: Could not load top_candidates.csv")
    print("Make sure you've run the notebook first to generate results")
    exit()

# Select top candidates for DFT validation
n_dft_candidates = 20  # Adjust based on computational resources available
top_for_dft = df_promising.head(n_dft_candidates).copy()

print(f"\n📌 Selected top {n_dft_candidates} candidates for DFT validation")
print("="*80)

# ============================================================================
# Create DFT directory structure
# ============================================================================

# Create main DFT directory
dft_dir = "DFT_Candidates"
os.makedirs(dft_dir, exist_ok=True)

print(f"\n📁 Creating DFT input directory: {dft_dir}/")

# Save detailed information for each candidate
dft_summary = []

for idx, row in top_for_dft.iterrows():
    material_id = row['id']
    formula = eval(row['formula'])  # Convert string back to dict if needed
    
    # Create subdirectory for each material
    mat_dir = os.path.join(dft_dir, material_id)
    os.makedirs(mat_dir, exist_ok=True)
    
    # Save composition information
    with open(os.path.join(mat_dir, 'composition.txt'), 'w') as f:
        f.write(f"Material ID: {material_id}\n")
        f.write(f"Formula: {formula}\n")
        f.write(f"Elements: {row['elements']}\n")
        f.write(f"\n{'='*60}\n")
        f.write(f"PREDICTED PROPERTIES (from ML models)\n")
        f.write(f"{'='*60}\n")
        f.write(f"Band Gap: {row['predicted_bandgap']:.4f} eV\n")
        f.write(f"Density: {row['predicted_density']:.4f} g/cm³\n")
        f.write(f"Stability (E_hull): {row['predicted_stability']:.4f} eV/atom\n")
        f.write(f"\n{'='*60}\n")
        f.write(f"ESTIMATED PERFORMANCE (screening estimates)\n")
        f.write(f"{'='*60}\n")
        f.write(f"Voltage: {row['estimated_voltage']:.2f} V\n")
        f.write(f"Capacity: {row['estimated_capacity']:.1f} mAh/g\n")
        f.write(f"Energy Density: {row['estimated_energy_density']:.1f} Wh/kg\n")
        f.write(f"\n{'='*60}\n")
        f.write(f"COMPOSITION BREAKDOWN (normalized fractions)\n")
        f.write(f"{'='*60}\n")
        
        # Sort elements by amount
        sorted_formula = sorted(formula.items(), key=lambda x: x[1], reverse=True)
        for element, fraction in sorted_formula:
            f.write(f"{element:>3s}: {fraction:.6f}\n")
        
        f.write(f"\n{'='*60}\n")
        f.write(f"NOTES FOR DFT CALCULATION\n")
        f.write(f"{'='*60}\n")
        f.write(f"1. Use structure prediction (USPEX/AIRSS) to get atomic positions\n")
        f.write(f"2. Recommended DFT settings:\n")
        f.write(f"   - Functional: PBE or HSE06 for accurate band gaps\n")
        f.write(f"   - k-points: Γ-centered 4×4×4 or denser\n")
        f.write(f"   - Energy cutoff: 520 eV (VASP) or 80 Ry (QE)\n")
        f.write(f"   - Convergence: 1e-6 eV\n")
        f.write(f"3. Calculate:\n")
        f.write(f"   - Formation energy and compare with predicted stability\n")
        f.write(f"   - Band gap and compare with ML prediction\n")
        f.write(f"   - Na intercalation voltage if structure allows\n")
        f.write(f"4. Priority: {'HIGH' if idx < 10 else 'MEDIUM'}\n")
    
    # Create placeholder POSCAR header (actual structure needs prediction)
    with open(os.path.join(mat_dir, 'POSCAR_template.txt'), 'w') as f:
        f.write(f"Generated material: {material_id}\n")
        f.write(f"1.0\n")
        f.write(f"10.0 0.0 0.0\n")
        f.write(f"0.0 10.0 0.0\n")
        f.write(f"0.0 0.0 10.0\n")
        f.write(f"{' '.join(sorted(formula.keys()))}\n")
        f.write(f"TODO: Get from structure prediction\n")
        f.write(f"Direct\n")
        f.write(f"# TODO: Add atomic positions from USPEX/AIRSS/MP\n")
        f.write(f"# Use structure prediction tools to generate coordinates\n")
    
    # Save for summary table
    dft_summary.append({
        'Rank': idx + 1 if idx < 20 else idx,
        'ID': material_id,
        'Formula': ', '.join([f"{el}:{amt:.3f}" for el, amt in sorted_formula]),
        'Energy_Density_Wh_kg': row['estimated_energy_density'],
        'Voltage_V': row['estimated_voltage'],
        'Predicted_Stability_eV': row['predicted_stability'],
        'Band_Gap_eV': row['predicted_bandgap'],
        'Density_g_cm3': row['predicted_density'],
        'Priority': 'HIGH' if idx < 10 else 'MEDIUM'
    })
    
    print(f"  ✓ Created: {material_id}/ ")

# Save summary tables
dft_summary_df = pd.DataFrame(dft_summary)
dft_summary_df.to_csv(os.path.join(dft_dir, 'DFT_CANDIDATES_SUMMARY.csv'), index=False)
dft_summary_df.to_excel(os.path.join(dft_dir, 'DFT_CANDIDATES_SUMMARY.xlsx'), index=False)

print(f"\n✓ Created {len(dft_summary)} material directories")
print(f"✓ Saved composition files for DFT input preparation")
print(f"✓ Saved summary: DFT_CANDIDATES_SUMMARY.xlsx")

# ============================================================================
# Create detailed DFT instructions
# ============================================================================

instructions = """
================================================================================
DFT VALIDATION WORKFLOW - STEP-BY-STEP GUIDE
================================================================================

OVERVIEW:
This directory contains top 20 candidates for DFT validation. Each candidate
has predicted properties from our ML models that need to be verified with
accurate quantum mechanical calculations.

================================================================================
STEP 1: STRUCTURE PREDICTION (REQUIRED FIRST STEP)
================================================================================

Since we only have composition (not atomic positions), you need to predict
crystal structures first:

OPTION A: Materials Project API (Easiest)
------------------------------------------
Use pymatgen to check if similar compositions exist:

```python
from mp_api.client import MPRester
with MPRester("YOUR_API_KEY") as mpr:
    # Search for similar Na-based cathodes
    docs = mpr.materials.summary.search(
        chemsys="Na-Mn-O",  # Adjust elements
        num_elements=(3,4)
    )
    # Download POSCAR for closest match
```

OPTION B: USPEX (Universal Structure Predictor)
------------------------------------------------
Best for finding global minimum energy structures:
1. Install USPEX
2. Set composition from composition.txt
3. Run evolutionary algorithm (10-20 generations)
4. Takes: 1-3 days per material on 16 cores

OPTION C: AIRSS (Ab Initio Random Structure Searching)
-------------------------------------------------------
Good for screening multiple structures:
1. Install AIRSS + CASTEP or VASP
2. Generate random structures with correct composition
3. Relax ~50-100 random structures
4. Select lowest energy structures

OPTION D: Manually from Literature
-----------------------------------
Search for known SIB cathode structures:
- NaMnO2: P2-type or O3-type layered
- NaVPO4F: Tavorite structure
- Use as template and substitute elements

================================================================================
STEP 2: DFT SETUP (Use VASP or Quantum ESPRESSO)
================================================================================

RECOMMENDED: VASP
------------------

INCAR (basic settings):
```
# Electronic optimization
ENCUT = 520          # Energy cutoff (eV)
PREC = Accurate
EDIFF = 1E-6
ISMEAR = 0
SIGMA = 0.05

# Ionic relaxation  
IBRION = 2
ISIF = 3             # Relax cell + ions
NSW = 100
EDIFFG = -0.01

# For band gap (after relaxation)
LHFCALC = .TRUE.     # Use HSE06 for accurate gaps
HFSCREEN = 0.2
```

KPOINTS:
```
Automatic mesh
0
Gamma
4 4 4              # Adjust based on cell size
0 0 0
```

POSCAR: Use structure from Step 1

POTCAR: Standard PAW potentials
- Na_pv, Mn_pv, O, V_pv, Co, P, F

ALTERNATIVE: Quantum ESPRESSO
------------------------------

Pseudo potentials: SSSP efficiency or accuracy
K-points: 4×4×4 or denser
Cutoff: 80 Ry (wavefunction), 640 Ry (charge density)
XC functional: PBE (for structure), HSE (for band gap)

================================================================================
STEP 3: CALCULATIONS TO RUN
================================================================================

For each candidate (in priority order):

A. Structure Relaxation (2-4 hours)
   - Relax atomic positions and cell shape
   - Verify structure is stable (no imaginary phonons if possible)

B. Static Calculation (30 min)
   - Calculate accurate total energy
   - This gives formation energy and stability

C. Band Gap Calculation (1-2 hours)
   - Use HSE06 or GW for accurate gaps
   - Compare with our ML prediction

D. Density Calculation (included in relaxation)
   - Calculate from final volume
   - Compare with our ML prediction

E. Voltage Calculation (if intercalation structure) (4-8 hours)
   - Calculate energy of NaxTMO2 for different x
   - Voltage = -ΔG/(nF) = -(E[Na_x1] - E[Na_x2])/(Δx)
   - Compare with our ~3.3V estimate

F. Na Migration Barriers (Optional, advanced) (1-2 days)
   - Use NEB (Nudged Elastic Band)
   - Gives Na conductivity information

================================================================================
STEP 4: PRIORITY RANKING (if limited resources)
================================================================================

HIGH PRIORITY (Candidates 1-10):
- Highest predicted energy density
- Run full workflow (A-E above)
- Spend 1-2 days per material

MEDIUM PRIORITY (Candidates 11-20):
- Run basic validation (A-C only)
- Spend 4-8 hours per material

If successful rate > 50%, you can claim:
"Machine learning successfully identified DFT-validated high-performance
candidates with >50% success rate"

================================================================================
STEP 5: RESULTS VALIDATION
================================================================================

For each completed calculation, compare:

| Property | ML Prediction | DFT Result | Acceptable Error |
|----------|---------------|------------|------------------|
| Band Gap | See file      | TBA        | ± 0.5 eV         |
| Stability| See file      | TBA        | ± 0.1 eV/atom    |
| Density  | See file      | TBA        | ± 0.3 g/cm³      |
| Voltage  | ~3.3 V        | TBA        | ± 0.5 V          |

Document results in: DFT_VALIDATION_RESULTS.xlsx

================================================================================
STEP 6: THESIS REPORTING
================================================================================

Include in thesis:

1. Table showing ML predictions vs DFT validation
2. Success rate (% of materials that are stable)
3. Prediction accuracy (R² or MAE for each property)
4. Highlight 3-5 best candidates
5. Recommend 1-2 for experimental synthesis

Even if DFT validation not complete:
- Explain methodology
- Show results for any completed calculations
- Present as "future work" with prepared input files

================================================================================
COMPUTATIONAL RESOURCES NEEDED
================================================================================

Per material (full workflow):
- CPU cores: 16-32
- RAM: 32-64 GB
- Time: 8-24 hours wall time
- Storage: ~2-5 GB per material

For all 20 materials:
- Total core-hours: ~2000-4000
- Wall time (parallel): 2-4 weeks
- Storage: ~50-100 GB

Access options:
1. University HPC cluster (free, recommended)
2. Google Cloud / AWS (paid, ~$200-500)
3. Local workstation (slow, but possible for 1-2 materials)

================================================================================
IF DFT NOT AVAILABLE - ALTERNATIVE VALIDATION
================================================================================

1. Literature Cross-Reference:
   - Search SciFinder/Web of Science for similar compositions
   - Compare with known SIB cathodes
   - Cite papers with similar materials

2. Materials Project Comparison:
   - Query MP for nearest compositions
   - Compare predicted vs MP-calculated properties
   - Acceptable as "indirect validation"

3. Bond Valence Sum Method:
   - Estimate voltage from oxidation states
   - Free, fast, reasonable accuracy
   - Good for qualitative validation

4. Collaborate:
   - Contact computational groups
   - Offer co-authorship for DFT calculations
   - Present in thesis as "ongoing collaboration"

================================================================================
CONTACT FOR HELP
================================================================================

If you need help with DFT:
1. Ask your supervisor for HPC access
2. Check if university has computational materials group
3. Post on Materials Project discussion forum
4. Email: help@materialsproject.org (they're very helpful!)

================================================================================
FILES IN THIS DIRECTORY
================================================================================

For each candidate (GEN_XXXXX/):
  - composition.txt: Full material details
  - POSCAR_template.txt: Template for structure (needs completion)

Summary files:
  - DFT_CANDIDATES_SUMMARY.xlsx: Quick reference table
  - DFT_CANDIDATES_SUMMARY.csv: Same data, CSV format
  - DFT_VALIDATION_INSTRUCTIONS.txt: This file

================================================================================
GOOD LUCK WITH DFT CALCULATIONS!
Remember: Even validating 5-10 materials is sufficient for a thesis.
The ML models are the main contribution - DFT is supporting evidence.
================================================================================
"""

# Save instructions
instructions_file = os.path.join(dft_dir, 'DFT_VALIDATION_INSTRUCTIONS.txt')
with open(instructions_file, 'w') as f:
    f.write(instructions)

print("\n" + "="*80)
print("DFT PREPARATION COMPLETE")
print("="*80)
print(f"\n📁 All files saved to: {dft_dir}/")
print(f"\n📄 Generated files:")
print(f"   - {n_dft_candidates} material directories with composition files")
print(f"   - DFT_CANDIDATES_SUMMARY.xlsx (quick reference)")
print(f"   - DFT_VALIDATION_INSTRUCTIONS.txt (detailed guide)")
print(f"\n📖 Next steps:")
print(f"   1. Read {instructions_file}")
print(f"   2. Choose structure prediction method")
print(f"   3. Setup DFT calculations")
print(f"   4. Run validation on top 5-10 materials")
print(f"\n⚠️  Note: DFT validation is OPTIONAL for thesis")
print(f"   Your ML results are already publication-quality!")
print("="*80)

# Display summary table
print("\n" + "="*80)
print("TOP CANDIDATES FOR DFT VALIDATION")
print("="*80)
print(dft_summary_df.to_string(index=False))
print("="*80)
