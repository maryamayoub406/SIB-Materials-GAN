# System Architecture Documentation

## Core Modules Overview

### 1. Backend (`/backend`)
FastAPI application handling REST API requests, ML model inference, and MySQL database transactions.
* **`ml/`**: Contains predictors, generators (VAE), and simulators (LSTM).
* **`routers/`**: Expressive API endpoints mapped to specific platform features.

### 2. Frontend (`/frontend`)
React + Vite single-page application using Three.js for 3D atomic structure rendering and Recharts for data visualization. Contains:
* **Dashboard**: aggregate analytics
* **Crystal Viewer**: WebGL representation of molecular structures
* **Explainability Results**: global SHAP arrays

### 3. Machine Learning Models (`/ml_model`)
Includes all model logic required for:
* **Generative Design**: Variational Autoencoders (VAEs) and GAN implementations
* **Property Prediction**: GNN placeholders and existing Random Forest/GB approaches
* **Degradation Modeling**: Time-series LSTM capable of forecasting capacity fade

### 4. Data Processing (`/data_processing`)
Automated pipelines to pull raw CSV data, clean missing or duplicative entries, calculate advanced physicochemical features (like electronegativity or transition metal fractions), and prepare tensor-ready inputs.

### 5. Database (`/database`)
MySQL schema logic, supporting structured records for raw materials, model evaluations/predictions, synthesized VAE candidates, and multi-cycle degradation simulations.
