import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import toast from 'react-hot-toast'
import { simulateDegradation } from '../api/client'
import { LoadingSpinner, SectionHeader } from '../components/UI.jsx'

const EXAMPLE_FORMULAS = ['NaFeO2', 'NaCoO2', 'Na2MnO3', 'Na3V2(PO4)3', 'NaNiO2']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div style={{ fontWeight: 700, color: 'var(--teal)', marginBottom: 4 }}>Cycle {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 13 }}>
          {p.name}: <b>{p.value?.toFixed(p.name === 'Voltage' ? 4 : 3)}</b> {p.name === 'Voltage' ? 'V' : 'mAh/g'}
        </div>
      ))}
    </div>
  )
}

function DegradationGauge({ degradationIndex }) {
  const pct = Math.min(100, degradationIndex * 100)
  const color = pct < 30 ? '#34d399' : pct < 65 ? '#f59e0b' : '#f87171'
  const label = pct < 30 ? 'Healthy' : pct < 65 ? 'Degrading' : 'Critical'
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--bg-surface)" strokeWidth="12" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'JetBrains Mono' }}>{pct.toFixed(0)}%</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>degraded</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color }}>{label}</div>
    </div>
  )
}

export default function Degradation() {
  const [formula, setFormula] = useState('NaFeO2')
  const [initCap, setInitCap] = useState(150)
  const [totalCycles, setTotalCycles] = useState(500)
  const [tempC, setTempC] = useState(25)
  const [cRate, setCRate] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSimulate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await simulateDegradation({
        formula,
        initial_capacity: initCap,
        total_cycles: totalCycles,
        temperature_c: tempC,
        c_rate: cRate,
      })
      setResult(res.data)
      toast.success(`Degradation simulation complete for ${formula}`)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Simulation failed — check API connection')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.curve_data?.map(pt => ({
    cycle: pt.cycle,
    Capacity: parseFloat(pt.capacity.toFixed(3)),
    Voltage: parseFloat(pt.voltage.toFixed(4)),
    'Degradation Index': parseFloat((pt.degradation_index * 100).toFixed(2)),
  })) ?? []

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="📉 Degradation Simulation"
        subtitle="LSTM + Physics-based prediction of capacity fade, voltage decay and cycle life"
      />

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, marginBottom: 28 }}
      >
        <div className="section-title">Simulation Parameters</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Formula</label>
            <input className="input-field" value={formula} onChange={e => setFormula(e.target.value)} placeholder="NaFeO2" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Init Capacity (mAh/g)</label>
            <input type="number" className="input-field" min={50} max={400} value={initCap} onChange={e => setInitCap(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Total Cycles</label>
            <input type="number" className="input-field" min={10} max={5000} step={50} value={totalCycles} onChange={e => setTotalCycles(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Temperature (°C)</label>
            <input type="number" className="input-field" min={-20} max={80} value={tempC} onChange={e => setTempC(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>C-Rate</label>
            <select className="input-field" value={cRate} onChange={e => setCRate(Number(e.target.value))}>
              <option value={0.5}>0.5C</option><option value={1}>1C</option>
              <option value={2}>2C</option><option value={5}>5C</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {EXAMPLE_FORMULAS.map(f => (
            <button key={f} className="btn-secondary" onClick={() => setFormula(f)}
              style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, fontFamily: 'JetBrains Mono, monospace' }}>
              {f}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={handleSimulate} disabled={loading} style={{ minWidth: 220 }}>
          {loading ? '⏳ Simulating...' : '📉 Run Degradation Simulation'}
        </button>
      </motion.div>

      {loading && <LoadingSpinner text="Running LSTM degradation model..." />}

      <AnimatePresence>
        {result && (
          <motion.div key="deg-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Summary cards */}
            <div className="page-grid-4" style={{ marginBottom: 24 }}>
              {[
                { label: 'Initial Capacity', value: `${result.initial_capacity} mAh/g`, color: '#00d4a4' },
                { label: 'Final Capacity',   value: `${result.final_capacity?.toFixed(1)} mAh/g`, color: '#3b82f6' },
                { label: 'Capacity Retention', value: `${(result.capacity_retention * 100).toFixed(1)}%`, color: '#f59e0b' },
                { label: 'Cycle Life (80%)', value: `${result.cycle_life_predicted} cycles`, color: '#a78bfa' },
              ].map(({ label, value, color }, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 18, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Main chart */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
              <div className="section-title">Capacity Fade & Voltage Decay</div>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ right: 30, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,164,0.07)" />
                  <XAxis dataKey="cycle" tick={{ fill: '#8ba8c4', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Cycle Number', position: 'insideBottom', offset: -5, fill: '#8ba8c4', fontSize: 12 }} />
                  <YAxis yAxisId="left"  tick={{ fill: '#8ba8c4', fontSize: 11 }} axisLine={false} tickLine={false} unit=" mAh/g" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8ba8c4', fontSize: 11 }} axisLine={false} tickLine={false} unit=" V" domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#8ba8c4', fontSize: 12 }} />
                  <ReferenceLine yAxisId="left" y={result.initial_capacity * 0.8} stroke="#f59e0b" strokeDasharray="5 5"
                    label={{ value: '80% threshold', fill: '#f59e0b', fontSize: 10 }} />
                  <Line yAxisId="left"  type="monotone" dataKey="Capacity" stroke="#00d4a4" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#00d4a4' }} />
                  <Line yAxisId="right" type="monotone" dataKey="Voltage"  stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} strokeDasharray="6 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom row */}
            <div className="page-grid-2">
              {/* Degradation gauge + details */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                <div className="section-title">Degradation Index</div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <DegradationGauge degradationIndex={result.degradation_index} />
                  <div style={{ flex: 1 }}>
                    {[
                      { label: 'Voltage Decay',      value: `${result.voltage_decay?.toFixed(3)} V`, color: '#3b82f6' },
                      { label: 'Degradation Index',  value: result.degradation_index?.toFixed(4),    color: '#f87171' },
                      { label: 'Model Type',         value: result.model_type,                        color: '#8ba8c4' },
                    ].map(({ label, value, color }, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI summary */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                <div className="section-title">📝 Simulation Summary</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.9, background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--teal)' }}>
                  {result.summary}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Degradation progress</div>
                  <div className="progress-bar-track" style={{ height: 10 }}>
                    <div className="progress-bar-fill" style={{
                      width: `${result.degradation_index * 100}%`,
                      background: result.degradation_index > 0.5 ? 'linear-gradient(90deg, #f59e0b, #f87171)' : 'linear-gradient(90deg, #34d399, #00d4a4)',
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
