import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getHealth } from '../api/client'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '⬡' },
  { path: '/predict', label: 'Prediction', icon: '⚡' },
  { path: '/generate', label: 'Generation', icon: '✦' },
  { path: '/degradation', label: 'Degradation', icon: '📉' },
  { path: '/crystal', label: '3D Viewer', icon: '⬡' },
  { path: '/results', label: 'Results & XAI', icon: '📊' },
]

export default function Sidebar() {
  const [apiStatus, setApiStatus] = useState('checking')
  const location = useLocation()

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 240, zIndex: 100,
      background: 'linear-gradient(180deg, #0a1628 0%, #060d1f 100%)',
      borderRight: '1px solid rgba(0,212,164,0.12)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #00d4a4, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#060d1f',
            boxShadow: '0 0 20px rgba(0,212,164,0.4)',
          }}>🔋</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#e8f4f8', lineHeight: 1.2 }}>SIB Discovery</div>
            <div style={{ fontSize: 10, color: '#00d4a4', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>AI Platform</div>
          </div>
        </div>

        {/* API status */}
        <div style={{
          marginTop: 16, padding: '6px 12px',
          background: apiStatus === 'online' ? 'rgba(52,211,153,0.08)' : apiStatus === 'offline' ? 'rgba(248,113,113,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${apiStatus === 'online' ? 'rgba(52,211,153,0.25)' : apiStatus === 'offline' ? 'rgba(248,113,113,0.25)' : 'rgba(245,158,11,0.25)'}`,
          borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: apiStatus === 'online' ? '#34d399' : apiStatus === 'offline' ? '#f87171' : '#f59e0b',
            ...(apiStatus === 'online' ? { animation: 'pulse-glow 2s ease infinite' } : {}),
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: apiStatus === 'online' ? '#34d399' : apiStatus === 'offline' ? '#f87171' : '#f59e0b' }}>
            API {apiStatus === 'checking' ? 'Connecting...' : apiStatus === 'online' ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding: '0 20px 10px', fontSize: 10, color: '#4a6580', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
        Navigation
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {NAV_ITEMS.map(({ path, label, icon }) => {
          const active = location.pathname === path
          return (
            <NavLink key={path} to={path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 4 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', marginBottom: 4,
                  borderRadius: 10,
                  background: active ? 'rgba(0,212,164,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(0,212,164,0.25)' : '1px solid transparent',
                  color: active ? '#00d4a4' : '#8ba8c4',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{icon}</span>
                <span>{label}</span>
                {active && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                    background: '#00d4a4',
                    boxShadow: '0 0 8px rgba(0,212,164,0.8)',
                  }} />
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}

    </aside>
  )
}
