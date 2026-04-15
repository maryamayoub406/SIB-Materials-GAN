import axios from 'axios'

const BASE = '/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Health ──────────────────────────────────────
export const getHealth = () => api.get('/health')

// ── Dashboard ───────────────────────────────────
export const getDashboard = () => api.get('/dashboard')

// ── Prediction ──────────────────────────────────
export const predictProperties = (formula, composition = null) =>
  api.post('/predict', { formula, composition })

// ── Generation ──────────────────────────────────
export const generateMaterials = (params = {}) =>
  api.post('/generate', {
    num_materials: params.num_materials ?? 10,
    filter_valid_only: params.filter_valid_only ?? true,
    min_energy_density: params.min_energy_density ?? 200,
    temperature: params.temperature ?? 1.0,
  })

// ── Degradation ─────────────────────────────────
export const simulateDegradation = (params) =>
  api.post('/degradation', params)

// ── Ranking ─────────────────────────────────────
export const rankMaterials = (params = {}) =>
  api.post('/rank', {
    formulas: params.formulas ?? null,
    top_n: params.top_n ?? 20,
    sort_by: params.sort_by ?? 'performance_score',
  })

// ── Material detail ─────────────────────────────
export const getMaterial = (id) => api.get(`/material/${id}`)
export const listMaterials = (skip = 0, limit = 20) =>
  api.get(`/materials?skip=${skip}&limit=${limit}`)

export default api
