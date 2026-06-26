import { useState } from 'react'
import { api } from '@/lib/api'
import { Sun, Moon, RefreshCw, Bell, Mail, User2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { theme } from '@/styles/theme'
import { toastError, toastSuccess } from '@/lib/toast'
import { useTheme } from '@/providers/ThemeProvider'
// Removendo dependências de Material Tailwind para compatibilidade com React 19

type Props = { onToggleSidebar?: () => void }
export default function Topbar({ onToggleSidebar }: Props) {
  const { theme: currentTheme, toggle } = useTheme()
  const dark = currentTheme === 'dark'

  const [running, setRunning] = useState(false)

  async function refreshAnalytics() {
    try {
      setRunning(true)
      const resp = await api.post('/analytics/run-now')
      toastSuccess(resp?.data?.message || 'Analytics disparado')
    } catch (e) {
      toastError('Falha ao disparar analytics')
    } finally {
      setRunning(false)
    }
  }

  return (
  <header className="sticky top-0 flex w-full bg-cine-surface border-cine z-[99999] lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6 w-full">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-cine sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
        className="items-center justify-center w-10 h-10 text-cine border-cine rounded-lg z-[99999] lg:flex lg:h-11 lg:w-11 lg:border bg-cine-surface-90 hover-cine"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 hidden lg:block">
            <input
              type="text"
              placeholder="Buscar ou digitar comando..."
              className="h-11 w-full rounded-lg border border-cine bg-cine-surface py-2.5 pl-4 pr-4 text-sm text-cine placeholder:text-cine-muted focus:outline-hidden ring-cine-primary lg:w-[430px]"
            />
          </div>

          <button
            className="rounded-lg border border-cine bg-cine-surface-90 px-3 py-2 text-sm hover-cine inline-flex items-center gap-2 text-cine"
            onClick={refreshAnalytics}
            disabled={running}
          >
            <RefreshCw size={16} /> {running ? 'Atualizando…' : 'Atualizar analytics'}
          </button>

          <button
            className="relative flex items-center justify-center text-cine transition-colors bg-cine-surface border border-cine rounded-full h-11 w-11 hover-cine"
            onClick={toggle}
            title="Alternar tema"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="inline-flex items-center gap-2">
            <button className="h-11 w-11 inline-grid place-items-center rounded-lg border border-cine bg-cine-surface hover-cine text-cine" title="Notificações">
              <Bell size={16} />
            </button>
            <button className="h-11 w-11 inline-grid place-items-center rounded-lg border border-cine bg-cine-surface hover-cine text-cine" title="Mensagens">
              <Mail size={16} />
            </button>
            <button className="h-11 w-11 inline-grid place-items-center rounded-lg border border-cine bg-cine-surface hover-cine text-cine" title="Perfil">
              <User2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}