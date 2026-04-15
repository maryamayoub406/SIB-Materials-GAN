import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import { LoadingSpinner } from './components/UI.jsx'

const Dashboard    = lazy(() => import('./pages/Dashboard.jsx'))
const Prediction   = lazy(() => import('./pages/Prediction.jsx'))
const Generation   = lazy(() => import('./pages/Generation.jsx'))
const Degradation  = lazy(() => import('./pages/Degradation.jsx'))
const CrystalView  = lazy(() => import('./pages/CrystalView.jsx'))
const Results      = lazy(() => import('./pages/Results.jsx'))

export default function App() {
  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/predict"     element={<Prediction />} />
            <Route path="/generate"    element={<Generation />} />
            <Route path="/degradation" element={<Degradation />} />
            <Route path="/crystal"     element={<CrystalView />} />
            <Route path="/results"     element={<Results />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
