"""
Database setup script — creates MySQL database, tables, and seeds top candidates.
Run this ONCE before starting the backend server.

Usage:
    cd FYP
    python scripts/setup_db.py
"""
import os
import sys
import json
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# Load .env if present
from dotenv import load_dotenv
load_dotenv(ROOT / "backend" / ".env")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "sib_battery")


def create_database():
    """Create the MySQL database if it doesn't exist."""
    import pymysql
    print(f"[Setup] Connecting to MySQL at {DB_HOST}:{DB_PORT} as '{DB_USER}'...")
    conn = pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD,
        charset="utf8mb4", autocommit=True
    )
    cursor = conn.cursor()
    cursor.execute(
        f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )
    print(f"[Setup] Database '{DB_NAME}' ready.")
    cursor.close()
    conn.close()


def create_tables():
    """Create all tables via SQLAlchemy."""
    from backend.database import engine
    from backend.models.db_models import Base
    Base.metadata.create_all(bind=engine)
    print("[Setup] All tables created.")


def seed_materials():
    """Seed top candidates CSV into the materials table."""
    from backend.database import SessionLocal
    from backend.models.db_models import Material

    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(Material).count()
        if existing > 0:
            print(f"[Seed] Materials table already has {existing} rows — skipping.")
            return

        csv_path = ROOT / "Data" / "Top_Candidates" / "top_candidates.csv"
        if not csv_path.exists():
            print(f"[Seed] {csv_path} not found — skipping material seed.")
            return

        df = pd.read_csv(csv_path)
        print(f"[Seed] Loading {len(df)} materials from {csv_path.name}...")

        # Column mapping (handles both CSV schemas)
        col_map = {
            "elements": ["elements", "formula"],
            "energy_density": ["estimated_energy_density", "energy_density"],
            "voltage": ["estimated_voltage", "voltage"],
            "specific_capacity": ["estimated_capacity", "specific_capacity"],
            "structural_stability": ["predicted_stability", "structural_stability"],
            "band_gap": ["predicted_bandgap", "band_gap"],
            "density": ["predicted_density", "density"],
        }

        def get_col(row, options, default=None):
            for c in options:
                if c in row.index and pd.notna(row[c]):
                    return row[c]
            return default

        added = 0
        for _, row in df.iterrows():
            mat = Material(
                formula=str(get_col(row, col_map["elements"], "Unknown")),
                elements=str(get_col(row, col_map["elements"], "")),
                num_elements=int(row.get("num_elements", 3)) if "num_elements" in row else 3,
                energy_density=float(get_col(row, col_map["energy_density"], 300)),
                voltage=float(get_col(row, col_map["voltage"], 3.2)),
                specific_capacity=float(get_col(row, col_map["specific_capacity"], 150)),
                structural_stability=float(get_col(row, col_map["structural_stability"], 0.05)),
                band_gap=float(get_col(row, col_map["band_gap"], 1.5)),
                density=float(get_col(row, col_map["density"], 4.0)),
                source="top_candidates_csv",
            )
            db.add(mat)
            added += 1

            if added % 500 == 0:
                db.commit()
                print(f"  [Seed] {added}/{len(df)} committed...")

        db.commit()
        print(f"[Seed] Seeded {added} materials into 'materials' table.")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "="*55)
    print("  SIB Platform - Database Setup")
    print("="*55)

    try:
        create_database()
    except Exception as e:
        print(f"[Setup] Could not create database: {e}")
        print("  -> Make sure MySQL is running and credentials in backend/.env are correct.")
        sys.exit(1)

    create_tables()
    seed_materials()

    print("\n[Setup] Database setup complete!")
    print(f"  Database: {DB_NAME}")
    print("  Tables: materials, predictions, generated_materials, degradation_results, users")
    print("\nNext step: cd FYP && python -m backend.main")
