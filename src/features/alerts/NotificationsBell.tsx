import React from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotificationsStore, useNotificationsSSE } from './useNotifications'
import { Link } from 'react-router-dom'

export default function NotificationsBell() {
  const { items, unread, fetchAll, markAllRead } = useNotificationsStore()
  useNotificationsSSE()
  React.useEffect(() => { fetchAll({ limit: 20 }).catch(() => {}) }, [fetchAll])
  const [open, setOpen] = React.useState(false)
  const lastFive = items.slice(0, 5)
  return (
    <div className="relative">
      <button aria-label="Notificações" className="relative p-2 rounded-md bg-white/5 hover:bg-white/10 text-white" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span aria-label="badge" className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full bg-red-500 text-white">{Math.min(unread, 9)}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-[#1C1835] shadow-xl z-50">
          <div className="p-2 border-b border-white/10 flex items-center justify-between">
            <div className="text-white/80 text-sm">Notificações</div>
            <button className="text-xs px-2 py-1 rounded-md bg-white/10 text-white hover:bg-white/20 inline-flex items-center gap-1" onClick={() => markAllRead()}>
              <CheckCheck className="h-3 w-3" /> Marcar todas
            </button>
          </div>
          <ul className="max-h-80 overflow-auto">
            {lastFive.length === 0 ? (
              <li className="p-3 text-white/60 text-sm">Sem notificações</li>
            ) : lastFive.map((n) => (
              <li key={n.id} className="px-3 py-2 hover:bg-white/5">
                <Link to={`/inbox/${n.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white">{n.title}</div>
                    {!n.read_at && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-400" />}
                  </div>
                  <div className="text-xs text-white/70 line-clamp-2">{n.message}</div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-2 border-t border-white/10">
            <Link to="/inbox" className="text-[#06B6D4] text-sm">Ver todas</Link>
          </div>
        </div>
      )}
    </div>
  )
}