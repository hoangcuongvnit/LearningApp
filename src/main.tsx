import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
// Bootstrap's JS (collapse, dropdowns, etc.)
import 'bootstrap/dist/js/bootstrap.bundle.min'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
