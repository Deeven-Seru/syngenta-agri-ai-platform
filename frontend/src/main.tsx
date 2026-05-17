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
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SuperTokensWrapper>
  </StrictMode>,
)
