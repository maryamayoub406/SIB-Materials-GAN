import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import { LoadingSpinner } from './components/UI.jsx'
import { AuthProvider, useAuth } from './components/AuthContext.jsx'

const Dashboard    = lazy(() => import('./pages/Dashboard.jsx'))
const Prediction   = lazy(() => import('./pages/Prediction.jsx'))
const Generation   = lazy(() => import('./pages/Generation.jsx'))
const Degradation  = lazy(() => import('./pages/Degradation.jsx'))
const CrystalView  = lazy(() => import('./pages/CrystalView.jsx'))
const Results      = lazy(() => import('./pages/Results.jsx'))
const Login        = lazy(() => import('./pages/Login.jsx'))
const Register     = lazy(() => import('./pages/Register.jsx'))

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner text="Authenticating..." />
  return user ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner text="Loading..." />
  return user ? <Navigate to="/" /> : children
}

const AppLayout = () => {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="page-wrapper">
      {!isAuthPage && <Sidebar />}
      <main className={`main-content ${isAuthPage ? 'auth-content' : ''}`}>
        <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            
            <Route path="/"            element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/predict"     element={<PrivateRoute><Prediction /></PrivateRoute>} />
            <Route path="/generate"    element={<PrivateRoute><Generation /></PrivateRoute>} />
            <Route path="/degradation" element={<PrivateRoute><Degradation /></PrivateRoute>} />
            <Route path="/crystal"     element={<PrivateRoute><CrystalView /></PrivateRoute>} />
            <Route path="/results"     element={<PrivateRoute><Results /></PrivateRoute>} />
            <Route path="*"            element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}
