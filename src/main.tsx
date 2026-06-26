import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/queryClient'
// Removido: estilos antigos (globals, themes, react_movie)
// Importação do tema Datta Able Free (CSS compilado)
// Remoção de tema antigo (Datta Able) para ativar novo tema Tailwind
// Caso necessário, importar apenas estilos próprios do projeto
// import './styles/overrides.css'
import './styles/global.css'
import App from './App'

// Opcional: limpar sessões salvas ao iniciar em modo E2E ou quando explicitamente habilitado
try {
  const resetOnStart = (import.meta as any).env?.VITE_RESET_AUTH_ON_START === 'true' || (import.meta as any).env?.VITE_E2E_MODE === 'true'
  if (resetOnStart) {
    localStorage.removeItem('av-auth')
  }
} catch (_) {
  // silencioso
}
import { ThemeProvider } from './providers/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
          <Toaster position="top-center" />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
