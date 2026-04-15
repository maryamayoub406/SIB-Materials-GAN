import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import toast from 'react-hot-toast'
import { generateMaterials } from '../api/client'
import { LoadingSpinner, SectionHeader } from '../components/UI.jsx'

function ScoreBar({ score }) {
  const color = score > 75 ? '#34d399' : score > 50 ? '#f59e0b' : '#f87171'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-surface)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36 }}>{score.toFixed(0)}</span>
    </div>
  )
}

export default function Generation() {
  const [numMaterials, setNumMaterials] = useState(10)
  const [filterValid, setFilterValid] = useState(true)
  const [minEnergy, setMinEnergy] = useState(200)
  const [temperature, setTemperature] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await generateMaterials({
        num_materials: numMaterials,
        filter_valid_only: filterValid,
        min_energy_density: minEnergy,
        temperature,
      })
      setResult(res.data)
      toast.success(`Generated ${res.data.valid_count} valid materials!`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Generation failed — check API connection')
    } finally {
      setLoading(false)
    }
  }

  const scatterData = result?.materials?.map(m => ({
    x: m.voltage,
    y: m.energy_density,
    score: m.performance_score,
    formula: m.formula,
  })) ?? []

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="✦ Material Generation"
        subtitle="Generate novel sodium-ion battery cathode materials using the Variational Autoencoder (VAE)"
      />

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 28 }}
      >
        <div className="section-title">Generation Parameters</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Number of Materials
            </label>
            <input type="number" className="input-field" min={1} max={50} value={numMaterials}
              onChange={e => setNumMaterials(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Min Energy (Wh/kg)
            </label>
            <input type="number" className="input-field" min={0} max={1000} step={50} value={minEnergy}
              onChange={e => setMinEnergy(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              Temperature (diversity)
            </label>
            <input type="number" className="input-field" min={0.5} max={3.0} step={0.1} value={temperature}
              onChange={e => setTemperature(Number(e.target.value))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              <input type="checkbox" checked={filterValid} onChange={e => setFilterValid(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--teal)' }} />
              Filter valid only
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn-primary" onClick={handleGenerate} disabled={loading} style={{ minWidth: 200 }}>
            {loading ? '⏳ Generating...' : `✦ Generate ${numMaterials} Materials`}
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            VAE samples from latent space → validates → ranks by performance score
          </div>
        </div>

        {/* Model info badges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {['VAE Encoder (30D latent)', 'Chemical Validity Filter', 'Energy Density Screen', 'Performance Ranking'].map(t => (
            <span key={t} className="badge badge-teal">{t}</span>
          ))}
        </div>
      </motion.div>

      {loading && <LoadingSpinner text="VAE generating and validating materials..." />}

      <AnimatePresence>
        {result && (
          <motion.div key="gen-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Summary */}
            <div className="page-grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: 'Total Sampled',  value: result.total_generated, color: '#8ba8c4' },
                { label: 'Valid Returned', value: result.valid_count,     color: '#00d4a4' },
                { label: 'Session ID',     value: result.session_id,      color: '#3b82f6' },
                { label: 'Pass Rate',      value: `${((result.valid_count / result.total_generated) * 100).toFixed(0)}%`, color: '#f59e0b' },
              ].map(({ label, value, color }, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 18, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Scatter plot */}
            {scatterData.length > 1 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
                <div className="section-title">Voltage vs Energy Density (colored by score)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,164,0.07)" />
                    <XAxis dataKey="x" type="number" name="Voltage" unit="V" tick={{ fill: '#8ba8c4', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto','auto']} />
                    <YAxis dataKey="y" type="number" name="Energy Density" unit=" Wh/kg" tick={{ fill: '#8ba8c4', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto','auto']} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ background: '#0f1d35', border: '1px solid rgba(0,212,164,0.3)', borderRadius: 8 }}
                      formatter={(v, n) => [n === 'Energy Density' ? `${v.toFixed(0)} Wh/kg` : `${v.toFixed(2)} V`, n]}
                    />
                    <Scatter data={scatterData} name="Materials">
                      {scatterData.map((d, i) => (
                        <Cell key={i} fill={d.score > 75 ? '#00d4a4' : d.score > 50 ? '#f59e0b' : '#f87171'} fillOpacity={0.8} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Table */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <div className="section-title">Generated Materials — Ranked by Performance</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th><th>Formula</th><th>Elements</th>
                    <th>Energy (Wh/kg)</th><th>Voltage (V)</th>
                    <th>Stability</th><th>Valid</th><th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {result.materials.map((m, i) => (
                    <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <td>
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : `#${m.rank}`}
                        </span>
                      </td>
                      <td><span style={{ fontFamily: 'JetBrains Mono', color: 'var(--teal)', fontSize: 12 }}>{m.formula}</span></td>
                      <td style={{ fontSize: 11 }}>{m.elements}</td>
                      <td><b style={{ color: 'var(--gold)' }}>{m.energy_density.toFixed(0)}</b></td>
                      <td>{m.voltage.toFixed(2)}</td>
                      <td>
                        <span style={{ color: m.structural_stability < 0.05 ? 'var(--green)' : 'var(--gold)', fontWeight: 600 }}>
                          {m.structural_stability.toFixed(3)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${m.validity_passed ? 'badge-green' : 'badge-red'}`}>
                          {m.validity_passed ? '✓' : '✗'}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}><ScoreBar score={m.performance_score} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
