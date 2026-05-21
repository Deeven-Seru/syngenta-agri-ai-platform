import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SuperTokensWrapper } from 'supertokens-auth-react'
import { initSuperTokens } from './auth'
import './index.css'
import App from './App.tsx'

initSuperTokens();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SuperTokensWrapper>
      {/* basename must match Vite's base config to prevent infinite auth redirect loops */}
      <BrowserRouter basename="/syngenta-agri-ai-platform">
        <App />
      </BrowserRouter>
    </SuperTokensWrapper>
  </StrictMode>,
)
