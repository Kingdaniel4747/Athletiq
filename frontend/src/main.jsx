import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)

// The installable PWA caches the app shell when served over HTTPS.
const localHost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || localHost)) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
