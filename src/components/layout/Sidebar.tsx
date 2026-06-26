import { NavLink } from 'react-router-dom'
import { Home, Film, Settings, Network, Building2, Bot, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { theme } from '@/styles/theme'

// Menu alinhado ao pedido: Dashboard, Criação, Canais, Jobs, Provedores, Analytics, Configurações
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/create', label: 'Criação', icon: Film },
  { to: '/channels', label: 'Canais', icon: Network },
  { to: '/jobs', label: 'Jobs', icon: Building2 },
  { to: '/settings/providers', label: 'Provedores', icon: Bot },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Configurações', icon: Settings },
]

type Props = { mobileOpen?: boolean; onClose?: () => void }
export default function Sidebar({ mobileOpen = false, onClose }: Props) {
  return (
    <aside className={cn('w-64 fixed inset-y-0 left-0 z-30 flex flex-col overflow-y-auto border-r border-gray-200 bg-white p-4 text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300')}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('h-9 w-9 rounded-xl bg-gradient-to-r', theme.gradient)} />
        <div>
          <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">Automatizador</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin Dashboard</p>
        </div>
      </div>
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group menu-item no-underline transition-colors duration-200 ease-cine text-cine hover:bg-[var(--cine-hover)] hover:text-cine',
                isActive ? 'bg-[var(--cine-hover)] text-[var(--cine-primary)] font-semibold border-l-2 border-[var(--cine-primary)]' : ''
              )
            }
          >
            <span className={cn('menu-item-icon menu-item-icon-size')}>
              <Icon size={20} className="shrink-0" />
            </span>
            <span className="menu-item-text truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-4 text-[11px] text-gray-500 dark:text-gray-400">Tema: TailAdmin aplicado</div>
    </aside>
  )
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose?: () => void }) {
  return (
    <div className={`md:hidden fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={cn('h-9 w-9 rounded-xl bg-gradient-to-r', theme.gradient)} />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">Automatizador</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Dashboard</p>
          </div>
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn('group menu-item no-underline transition-colors duration-200 ease-cine text-cine hover:bg-[var(--cine-hover)] hover:text-cine', isActive ? 'bg-[var(--cine-hover)] text-[var(--cine-primary)] font-semibold border-l-2 border-[var(--cine-primary)]' : '')
              }
            >
              <span className={cn('menu-item-icon menu-item-icon-size')}>
                <Icon size={20} className="shrink-0" />
              </span>
              <span className="menu-item-text truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  )
}