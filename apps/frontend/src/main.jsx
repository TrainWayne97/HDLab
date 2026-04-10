import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (!import.meta.env.VITE_API_URL) {
  // eslint-disable-next-line no-console
  console.warn('[Frontend] Warning: VITE_API_URL is not set! API calls may fail.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
