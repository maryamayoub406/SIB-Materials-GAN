"""
Train LSTM degradation model on synthetic battery cycling data.
Generates realistic capacity-fade curves and trains the LSTM.

Usage:
    cd FYP
    python scripts/train_lstm.py
"""
import sys
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

MODEL_DIR = ROOT / "Models"
MODEL_DIR.mkdir(exist_ok=True)

from backend.ml.lstm_degradation import DegradationLSTM, INPUT_FEATURES, OUTPUT_FEATURES

# ── Synthetic data generation ──────────────────────────────────

def generate_synthetic_dataset(n_samples=500, max_cycles=1000, seed=42):
    """Generate synthetic degradation curves with varied material properties."""
    rng = np.random.RandomState(seed)
    X_all, y_all = [], []

    for _ in range(n_samples):
        # Random material parameters
        init_cap = rng.uniform(100, 300)        # mAh/g
        init_volt = rng.uniform(2.8, 4.2)       # V
        stability = rng.uniform(0.01, 0.15)     # eV/atom
        temp = rng.uniform(15, 55)              # °C
        c_rate = rng.choice([0.5, 1.0, 2.0, 5.0])
        n_cycles = rng.randint(100, max_cycles)

        # Physics parameters
        k = 0.00015 + stability * 0.002
        k_temp = 1.0 + max(0, (temp - 25)) * 0.005
        k_rate = 1.0 + (c_rate - 1) * 0.1
        alpha = k * k_temp * k_rate

        sample_cycles = np.linspace(0, n_cycles, 50, dtype=int)
        X_seq, y_seq = [], []

        cap_prev = init_cap
        volt_prev = init_volt

        for cyc in sample_cycles:
            cycle_norm = cyc / max_cycles
            temp_norm = (temp - 25) / 25
            c_norm = (c_rate - 1) / 4
            cap_norm_in = cap_prev / init_cap
            volt_norm_in = volt_prev / init_volt

            X_seq.append([cycle_norm, temp_norm, c_norm, cap_norm_in, volt_norm_in])

            # True target (normalized)
            frac = np.exp(-alpha * np.sqrt(cyc)) * 0.6 + max(0, 1 - alpha * 1.5 * cyc / n_cycles) * 0.4
            frac = float(np.clip(frac + rng.normal(0, 0.003), 0.0, 1.0))
            volt_decay = 0.15 * (1 - frac) * k_rate
            v_frac = float(np.clip((init_volt - volt_decay) / init_volt, 0.3, 1.0))

            y_seq.append([frac, v_frac])
            cap_prev = init_cap * frac
            volt_prev = init_volt * v_frac

        X_all.append(X_seq)
        y_all.append(y_seq)

    return (
        torch.FloatTensor(X_all),   # [N, T, 5]
        torch.FloatTensor(y_all),   # [N, T, 2]
    )


# ── Training ───────────────────────────────────────────────────

def train(epochs=80, lr=1e-3, batch_size=32):
    print("[LSTM Training] Generating synthetic dataset...")
    X, y = generate_synthetic_dataset(n_samples=600)
    n = len(X)
    split = int(n * 0.85)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    print(f"  Train: {split} | Val: {n - split}")

    model = DegradationLSTM(
        input_size=INPUT_FEATURES,
        hidden_size=64,
        num_layers=2,
        output_size=OUTPUT_FEATURES,
    )
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=20, gamma=0.5)
    criterion = nn.MSELoss()

    best_val = float("inf")
    best_state = None

    print(f"[LSTM Training] Starting {epochs} epochs...")
    for epoch in range(1, epochs + 1):
        model.train()
        perm = torch.randperm(X_train.size(0))
        total_loss = 0.0
        n_batches = 0

        for i in range(0, X_train.size(0), batch_size):
            idx = perm[i:i + batch_size]
            xb, yb = X_train[idx], y_train[idx]

            optimizer.zero_grad()
            out, _ = model(xb)
            loss = criterion(out, yb)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item()
            n_batches += 1

        scheduler.step()

        # Validation
        model.eval()
        with torch.no_grad():
            val_out, _ = model(X_val)
            val_loss = criterion(val_out, y_val).item()

        if val_loss < best_val:
            best_val = val_loss
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

        if epoch % 10 == 0 or epoch == 1:
            print(f"  Epoch {epoch:3d}/{epochs} | "
                  f"Train Loss: {total_loss/n_batches:.6f} | "
                  f"Val Loss: {val_loss:.6f}")

    # Save best
    model.load_state_dict(best_state)
    save_path = MODEL_DIR / "lstm_degradation.pth"
    torch.save(model.state_dict(), str(save_path))
    print(f"\n[LSTM Training] ✅ Best model saved → {save_path}")
    print(f"  Best validation loss: {best_val:.6f}")
    return model


if __name__ == "__main__":
    train()
