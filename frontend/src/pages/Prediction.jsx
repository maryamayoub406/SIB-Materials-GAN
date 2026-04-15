import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts'
import toast from 'react-hot-toast'
import { predictProperties } from '../api/client'
import { LoadingSpinner, SectionHeader, ValidationCard, ProgressRow } from '../components/UI.jsx'

const EXAMPLE_FORMULAS = [
  'NaFeO2', 'Na2MnO3', 'NaCoO2', 'Na3V2(PO4)3', 'NaNiO2', 'NaFe0.5Mn0.5O2',
]

const PROPERTY_DEFS = [
  { key: 'specific_capacity', label: 'Specific Capacity', unit: 'mAh/g', icon: '⚡', color: '#00d4a4', max: 350 },
  { key: 'voltage', label: 'Voltage', unit: 'V', icon: '🔌', color: '#3b82f6', max: 5 },
  { key: 'energy_density', label: 'Energy Density', unit: 'Wh/kg', icon: '⚡', color: '#f59e0b', max: 1200 },
  { key: 'formation_energy', label: 'Formation Energy', unit: 'eV/at', icon: '⚛', color: '#8b5cf6', max: 2 },
  { key: 'ionic_conductivity', label: 'Ionic Conductivity', unit: 'S/cm', icon: '🔬', color: '#ec4899', max: 0.01 },
  { key: 'na_diffusion_barrier', label: 'Na Diffusion Barrier', unit: 'eV', icon: '↔', color: '#06b6d4', max: 1 },
  { key: 'structural_stability', label: 'Structural Stability', unit: 'eV/at', icon: '🏗', color: '#34d399', max: 0.2 },
  { key: 'cycle_life', label: 'Cycle Life', unit: 'cycles', icon: '🔄', color: '#a78bfa', max: 3000 },
]

function PropertyGrid({ result }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      {PROPERTY_DEFS.map(({ key, label, unit, icon, color }) => {
        const val = result[key]
        const display = typeof val === 'number'
          ? (key === 'cycle_life' ? val.toLocaleString() : val.toFixed(key === 'ionic_conductivity' ? 6 : 3))
          : val
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${color}33`,
              borderRadius: 'var(--radius-md)',
              padding: 18,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{display}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{unit}</div>
          </motion.div>
        )
      })}
    </div>
  )
}

function SHAPChart({ shap_values }) {
  if (!shap_values?.length) return null
  const data = shap_values
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, 10)
    .map(s => ({
      name: s.element,
      value: parseFloat(s.shap_value.toFixed(4)),
      fill: s.shap_value > 0 ? '#00d4a4' : '#f87171',
    }))

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
      <div className="section-title">SHAP Feature Importance (Band Gap Model)</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,164,0.07)" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#8ba8c4', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: '#e8f4f8', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }} width={60} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0f1d35', border: '1px solid rgba(0,212,164,0.3)', borderRadius: 8 }}
            labelStyle={{ color: '#e8f4f8' }}
            formatter={(val) => [val.toFixed(4), 'SHAP value']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        🟢 Positive = increases band gap &nbsp; 🔴 Negative = decreases band gap
      </p>
    </div>
  )
}

function ScoreGauge({ score }) {
  const color = score > 75 ? 'var(--green)' : score > 50 ? 'var(--gold)' : 'var(--red)'
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
        Performance Score
      </div>
      <div style={{ fontSize: 56, fontWeight: 900, color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
        {score.toFixed(1)}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>/ 100 composite</div>
      <div style={{ marginTop: 12, height: 8, background: 'var(--bg-surface)', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

export default function Prediction() {
  const [formula, setFormula] = useState('NaFeO2')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handlePredict = async () => {
    if (!formula.trim()) return toast.error('Enter a material formula')
    setLoading(true)
    setResult(null)
    try {
      const res = await predictProperties(formula.trim())
      setResult(res.data)
      toast.success(`Prediction complete for ${formula}`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Prediction failed — check API connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="⚡ Property Prediction"
        subtitle="Input a material formula to predict 8 key battery properties with SHAP explainability"
      />

      {/* Input panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 28 }}
      >
        <div className="section-title">Material Formula Input</div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <input
              className="input-field"
              placeholder="e.g. NaFeO2, Na2MnO3, Na3V2(PO4)3"
              value={formula}
              onChange={e => setFormula(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePredict()}
            />
          </div>
          <button className="btn-primary" onClick={handlePredict} disabled={loading} style={{ minWidth: 160 }}>
            {loading ? '⏳ Predicting...' : ' Predict Properties'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Examples:</span>
          {EXAMPLE_FORMULAS.map(f => (
            <button key={f} className="btn-secondary" onClick={() => setFormula(f)}
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, fontFamily: 'JetBrains Mono, monospace' }}>
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {loading && <LoadingSpinner text="Running ML models + SHAP analysis..." />}

      <AnimatePresence>
        {result && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Formula header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20, padding: '14px 20px',
              background: 'linear-gradient(135deg, rgba(0,212,164,0.08), rgba(59,130,246,0.08))',
              border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 28, fontFamily: 'JetBrains Mono, monospace', color: 'var(--teal)', fontWeight: 800 }}>
                  {result.formula}
                </span>
                <span className={`badge ${result.validation?.passed ? 'badge-green' : 'badge-red'}`}>
                  {result.validation?.passed ? '✓ Valid' : '✗ Invalid'}
                </span>
              </div>
              <ScoreGauge score={result.performance_score} />
            </div>

            {/* 8 property cards */}
            <PropertyGrid result={result} />

            {/* Bottom row */}
            <div className="page-grid-2" style={{ marginBottom: 24 }}>
              <ValidationCard validation={result.validation} />
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text-primary)' }}>📝 Explanation</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {result.explanation?.split(' | ').map((line, i) => (
                    <div key={i} style={{ marginBottom: 6, padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: 6, borderLeft: '3px solid var(--border-bright)' }}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SHAP chart */}
            <SHAPChart shap_values={result.shap_values} />

            {/* Benchmark bar */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginTop: 24 }}>
              <div className="section-title">Energy Density Benchmark</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { name: 'Commercial SIB', value: 175, fill: '#4a6580' },
                  { name: result.formula, value: Math.round(result.energy_density), fill: '#00d4a4' },
                  { name: 'Best Generated', value: 987, fill: '#f59e0b' },
                ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,164,0.07)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#8ba8c4', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8ba8c4', fontSize: 11 }} axisLine={false} tickLine={false} unit=" Wh/kg" />
                  <Tooltip
                    contentStyle={{ background: '#0f1d35', border: '1px solid rgba(0,212,164,0.3)', borderRadius: 8 }}
                    labelStyle={{ color: '#e8f4f8' }}
                    formatter={(v) => [`${v} Wh/kg`, 'Energy Density']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                    {[
                      { fill: '#4a6580' },
                      { fill: '#00d4a4' },
                      { fill: '#f59e0b' },
                    ].map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
