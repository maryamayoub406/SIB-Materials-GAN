import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f1729',
            color: '#e2e8f0',
            border: '1px solid #1e3a5f',
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00d4a4', secondary: '#0f1729' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#0f1729' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
