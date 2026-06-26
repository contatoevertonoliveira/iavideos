import React from 'react'
import type { Notification } from '../useNotifications'
import { useNotificationsStore } from '../useNotifications'
import { Link } from 'react-router-dom'

export default function NotificationDetailsModal({ n, onClose }: { n: Notification; onClose: () => void }) {
  const markRead = useNotificationsStore((s) => s.markRead)
  React.useEffect(() => { markRead(n.id).catch(() => {}) }, [markRead, n.id])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="w-[92%] max-w-lg rounded-2xl border border-white/10 bg-[#16132B] p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white text-base font-medium">{n.title}</div>
          <button className="px-3 py-1.5 text-sm rounded-md border border-white/20 text-white/90 hover:bg-white/10" onClick={onClose}>Fechar</button>
        </div>
        <div className="text-sm text-white/80">{n.message}</div>
        {n.meta && (
          <pre className="mt-3 text-xs bg-black/40 text-white/70 rounded-lg p-2 overflow-auto max-h-40">{JSON.stringify(n.meta, null, 2)}</pre>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Link to="/posts/queue" className="text-sm px-3 py-2 rounded-md bg-white/10 text-white hover:bg-white/20">Ver fila</Link>
          <Link to="/configuracoes/contas" className="text-sm px-3 py-2 rounded-md bg-white/10 text-white hover:bg-white/20">Reautorizar conta</Link>
          <Link to="/analytics" className="text-sm px-3 py-2 rounded-md bg-white/10 text-white hover:bg-white/20">Abrir relatório</Link>
        </div>
      </div>
    </div>
  )
}