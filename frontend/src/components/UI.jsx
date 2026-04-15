import React from 'react'

export function StatCard({ label, value, sub, color = 'teal', icon }) {
  return (
    <div className={`stat-card ${color} animate-fade-in`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ marginTop: 8 }}>{value}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        {icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: color === 'teal' ? 'rgba(0,212,164,0.12)' :
                        color === 'blue' ? 'rgba(59,130,246,0.12)' :
                        color === 'gold' ? 'rgba(245,158,11,0.12)' : 'rgba(52,211,153,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 }}>
      <div className="spinner" />
      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{text}</span>
    </div>
  )
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>{subtitle}</p>
      )}
    </div>
  )
}

export function ValidationCard({ validation }) {
  if (!validation) return null
  const checks = [
    { key: 'formation_energy_ok',    label: 'Formation Energy < 0',     desc: 'Thermodynamically stable compound' },
    { key: 'charge_neutral',         label: 'Charge Neutrality',        desc: 'Balanced ionic charge' },
    { key: 'chemical_validity',      label: 'Chemical Validity',        desc: 'Contains Na, valid composition' },
    { key: 'structural_feasibility', label: 'Structural Feasibility',   desc: 'Compatible element count & ratio' },
  ]
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text-primary)' }}>
        Scientific Validation {validation.passed
          ? <span style={{ color: 'var(--green)', marginLeft: 8 }}>✅ Passed</span>
          : <span style={{ color: 'var(--red)', marginLeft: 8 }}>❌ Failed</span>}
      </div>
      {checks.map(c => (
        <div key={c.key} className="check-row">
          <span className={validation[c.key] ? 'check-icon-pass' : 'check-icon-fail'}>
            {validation[c.key] ? '✓' : '✗'}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PropertyBadge({ value, good, bad, unit = '' }) {
  const num = parseFloat(value)
  let color = 'badge-blue'
  if (!isNaN(num)) {
    if (good !== undefined && num >= good) color = 'badge-green'
    else if (bad !== undefined && num >= bad) color = 'badge-gold'
    else if (bad !== undefined) color = 'badge-red'
  }
  return <span className={`badge ${color}`}>{value}{unit}</span>
}

export function ProgressRow({ label, value, max = 100, color = 'var(--teal)' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>{value}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, var(--blue))` }} />
      </div>
    </div>
  )
}
