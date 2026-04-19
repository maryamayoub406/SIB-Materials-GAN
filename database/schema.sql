-- ============================================================
-- AI-Driven Sodium-Ion Battery Discovery Platform
-- MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS sib_battery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sib_battery;

-- ============================================================
-- USERS TABLE (optional auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role            ENUM('admin','researcher','viewer') DEFAULT 'viewer',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- MATERIALS TABLE (training / known materials)
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    formula             VARCHAR(255) NOT NULL,
    elements            VARCHAR(255),
    num_elements        INT,
    specific_capacity   FLOAT COMMENT 'mAh/g',
    voltage             FLOAT COMMENT 'V',
    energy_density      FLOAT COMMENT 'Wh/kg',
    formation_energy    FLOAT COMMENT 'eV/atom',
    ionic_conductivity  FLOAT COMMENT 'S/cm',
    na_diffusion_barrier FLOAT COMMENT 'eV',
    structural_stability FLOAT COMMENT 'eV/atom (hull distance)',
    band_gap            FLOAT COMMENT 'eV',
    density             FLOAT COMMENT 'g/cm3',
    cycle_life          INT COMMENT 'number of cycles',
    capacity_retention  FLOAT COMMENT 'fraction 0-1 after cycle_life',
    charge_neutral      TINYINT(1) DEFAULT 1,
    source              VARCHAR(100) DEFAULT 'materials_project',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PREDICTIONS TABLE (user prediction requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    formula             VARCHAR(255) NOT NULL,
    composition_json    JSON COMMENT 'element:fraction map',
    predicted_capacity  FLOAT,
    predicted_voltage   FLOAT,
    predicted_energy_density FLOAT,
    predicted_band_gap  FLOAT,
    predicted_density   FLOAT,
    predicted_stability FLOAT,
    predicted_ionic_conductivity FLOAT,
    predicted_na_diffusion FLOAT,
    predicted_cycle_life INT,
    shap_values_json    JSON COMMENT 'SHAP feature importances',
    explanation_text    TEXT,
    validity_passed     TINYINT(1) DEFAULT 1,
    validity_details    JSON,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id             INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- GENERATED_MATERIALS TABLE (VAE / GAN outputs)
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_materials (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    formula             VARCHAR(255),
    elements            VARCHAR(255),
    composition_json    JSON,
    generation_method   ENUM('GAN','VAE','diffusion') DEFAULT 'VAE',
    performance_score   FLOAT COMMENT '0-100 composite score',
    specific_capacity   FLOAT,
    voltage             FLOAT,
    energy_density      FLOAT,
    formation_energy    FLOAT,
    band_gap            FLOAT,
    density             FLOAT,
    structural_stability FLOAT,
    charge_neutral      TINYINT(1),
    validity_passed     TINYINT(1) DEFAULT 1,
    rank_position       INT,
    session_id          VARCHAR(100) COMMENT 'generation batch identifier',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DEGRADATION_RESULTS TABLE (LSTM simulation outputs)
-- ============================================================
CREATE TABLE IF NOT EXISTS degradation_results (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    material_id         INT,
    formula             VARCHAR(255),
    total_cycles        INT,
    initial_capacity    FLOAT COMMENT 'mAh/g',
    final_capacity      FLOAT,
    capacity_retention  FLOAT,
    voltage_decay       FLOAT COMMENT 'V drop over cycles',
    cycle_life_predicted INT,
    degradation_index   FLOAT COMMENT '0-1, higher = more degraded',
    curve_data_json     JSON COMMENT 'array of {cycle, capacity, voltage}',
    model_type          VARCHAR(50) DEFAULT 'LSTM',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_materials_formula ON materials(formula);
CREATE INDEX idx_materials_energy ON materials(energy_density DESC);
CREATE INDEX idx_predictions_formula ON predictions(formula);
CREATE INDEX idx_predictions_created ON predictions(created_at DESC);
CREATE INDEX idx_generated_score ON generated_materials(performance_score DESC);
CREATE INDEX idx_generated_session ON generated_materials(session_id);
CREATE INDEX idx_degradation_material ON degradation_results(material_id);
