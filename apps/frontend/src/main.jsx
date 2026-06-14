import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'

if (!import.meta.env.VITE_API_URL) {
  // eslint-disable-next-line no-console
  console.warn('[Frontend] Warning: VITE_API_URL is not set! API calls may fail.');
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider apiBase={API_BASE}>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
