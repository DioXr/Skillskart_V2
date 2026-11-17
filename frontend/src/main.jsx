import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// In development Vite proxies /api to localhost. In production, point the
// browser at the deployed API using VITE_API_URL (for example, a Render URL).
const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '')
if (apiUrl) axios.defaults.baseURL = apiUrl

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
