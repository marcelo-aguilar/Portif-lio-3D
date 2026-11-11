import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/anton/latin-400.css'
import '@fontsource-variable/bodoni-moda/opsz.css'
import '@fontsource-variable/bodoni-moda/opsz-italic.css'
import '@fontsource-variable/instrument-sans/index.css'
import './styles/base.css'

import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
