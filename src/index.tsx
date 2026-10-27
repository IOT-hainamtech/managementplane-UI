
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { AppProviders } from './core/providers/AppProviders'
import { AppRouter } from './core/router/AppRouter'
import './shared/styles/global.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('React root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
)
