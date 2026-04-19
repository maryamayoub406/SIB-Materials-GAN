import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getHealth } from '../api/client'
import { useAuth } from './AuthContext.jsx'

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
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile Header Toggle */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00d4a4, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#060d1f',
          }}>🔋</div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#e8f4f8' }}>SIB Discovery</span>
        </div>
        <button onClick={toggleSidebar} className="menu-toggle-btn">
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="sidebar-backdrop"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
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
        <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
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

        {/* Footer info & Logout */}
        {user && (
          <div style={{ padding: '20px', borderTop: '1px solid rgba(0,212,164,0.12)', background: 'rgba(0,0,0,0.2)' }}>
             <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
               <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--teal-glow)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user.name.charAt(0).toUpperCase()}
               </div>
               <div style={{ overflow: 'hidden' }}>
                 <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name}</div>
                 <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{user.role}</div>
               </div>
             </div>
             <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: 12 }}>
               Logout
             </button>
          </div>
        )}
      </aside>
    </>
  )
}
