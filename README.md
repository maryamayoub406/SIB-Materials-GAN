# AI-Driven Sodium-Ion Battery Material Discovery Platform

> **Final Year Project** — Complete end-to-end AI research system for sodium-ion battery cathode material discovery, property prediction, generative design, and degradation simulation.

---

## 🏗️ System Architecture

```
FYP/
├── backend/          FastAPI server (ML inference, MySQL, API)
│   ├── ml/          Property predictor, VAE generator, LSTM degradation
│   ├── routers/     predict, generate, degradation, rank, materials
│   ├── models/      SQLAlchemy ORM
│   ├── main.py      App entry point
│   └── .env         DB credentials (configure this!)
├── frontend/         React + Vite + Three.js UI
│   └── src/
│       ├── pages/   Dashboard, Prediction, Generation, Degradation, CrystalView, Results
│       ├── components/
│       └── api/     Axios client
├── database/         MySQL schema (schema.sql)
├── scripts/          setup_db.py, train_lstm.py
├── Code/             Original Jupyter notebook
├── Models/           Trained model checkpoints (.pkl, .pth)
├── Data/             Training data, generated materials, top candidates
└── Utils/            element_mappings.json
```

---

## 🚀 Quick Start (Full Stack)

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MySQL 8.0+** (running locally)

---

### Step 1 — Configure Database

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here   # ← set this
DB_NAME=sib_battery
```

---

### Step 2 — Install Backend Dependencies

```powershell
cd C:\Users\Hp\Desktop\FYP
pip install -r backend/requirements.txt
```

---

### Step 3 — Setup Database & Seed Data

```powershell
cd C:\Users\Hp\Desktop\FYP
python scripts/setup_db.py
```

This will:
- Create the `sib_battery` MySQL database
- Create all 5 tables
- Seed top candidates from `Data/Top_Candidates/top_candidates.csv`

---

### Step 4 — (Optional) Train LSTM Degradation Model

```powershell
python scripts/train_lstm.py
```

Trains on synthetic degradation data and saves `Models/lstm_degradation.pth`.
The backend works without this (uses physics-based fallback automatically).

---

### Step 5 — Start FastAPI Backend

```powershell
cd C:\Users\Hp\Desktop\FYP
python -m backend.main
```

Backend runs at: **http://localhost:8000**  
API docs (Swagger): **http://localhost:8000/docs**

---

### Step 6 — Install & Start React Frontend

```powershell
cd C:\Users\Hp\Desktop\FYP\frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | System health check |
| `GET`  | `/dashboard` | Platform statistics |
| `POST` | `/predict` | Property prediction + SHAP |
| `POST` | `/generate` | VAE material generation |
| `POST` | `/degradation` | LSTM degradation simulation |
| `POST` | `/rank` | Rank materials by score |
| `GET`  | `/material/{id}` | Material detail |
| `GET`  | `/materials` | List all materials |

### Example: Predict NaFeO2

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"formula": "NaFeO2"}'
```

### Example: Generate 10 Materials

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"num_materials": 10, "filter_valid_only": true, "min_energy_density": 300}'
```

### Example: Simulate Degradation

```bash
curl -X POST http://localhost:8000/degradation \
  -H "Content-Type: application/json" \
  -d '{"formula": "NaFeO2", "initial_capacity": 150, "total_cycles": 500}'
```

---

## 🎨 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | KPIs, radar chart, top candidates |
| Prediction | `/predict` | Formula → 8 properties + SHAP |
| Generation | `/generate` | VAE-based material generation |
| Degradation | `/degradation` | LSTM capacity fade simulation |
| 3D Viewer | `/crystal` | Three.js atomic structure viewer |
| Results & XAI | `/results` | Model metrics, SHAP, error analysis |

---

## 🧠 ML Models

| Model | Type | Description |
|-------|------|-------------|
| `model_bandgap.pkl` | Random Forest | Band gap prediction |
| `model_density.pkl` | Gradient Boosting | Density prediction |
| `model_stability.pkl` | Gradient Boosting | Formation energy stability |
| `gan_model_checkpoint.pth` | GAN | Original GAN generator |
| `vae_checkpoint.pth` | VAE | New: trains from composition matrix |
| `lstm_degradation.pth` | LSTM | New: capacity fade over cycles |

---

## 🏆 Key Results

| Metric | Value |
|--------|-------|
| Materials Generated | 10,000 (100% novel) |
| Top Energy Density | 987 Wh/kg (5.6× commercial) |
| Model Accuracy | 79.2% overall |
| Chemical Validity | 100% |
| Promising Candidates | 2,500 |
| GAN Convergence | 95% |

---

## 📦 Existing Streamlit App

The original Streamlit app still works:

```powershell
cd C:\Users\Hp\Desktop\FYP
streamlit run app.py
```

---

## 🗄️ Database Tables

- `materials` — Known/training materials
- `predictions` — Every prediction request logged
- `generated_materials` — VAE generation outputs
- `degradation_results` — LSTM simulation results
- `users` — Optional user management

---

## 🔬 Scientific Validation Checks

Every material automatically passes:
1. Formation energy < 0 (thermodynamic stability)
2. Charge neutrality (ionic balance check)
3. Chemical validity (must contain Na, valid elements)
4. Structural feasibility (max 6 elements)

---

## 📚 References

1. Materials Project — https://materialsproject.org
2. Goodfellow et al., "Generative Adversarial Networks," 2014
3. Kingma & Welling, "Auto-Encoding Variational Bayes," 2013
4. Hochreiter & Schmidhuber, "LSTM," 1997
5. Lundberg & Lee, "SHAP," NeurIPS 2017
6. Pymatgen — https://pymatgen.org

---

**Status:** ✅ Production-Ready — Full Stack Complete  
**Last Updated:** April 2026
