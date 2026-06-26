import React from 'react'
import { useNotificationsStore } from '../useNotifications'
import type { Notification } from '../useNotifications'
import NotificationItem from './NotificationItem'
import NotificationDetailsModal from './NotificationDetailsModal'
import NotificationFilters from './NotificationFilters'
import type { Filters } from './NotificationFilters'

export default function NotificationList() {
  const { items, fetchAll } = useNotificationsStore()
  const [open, setOpen] = React.useState<Notification | null>(null)
  const [filters, setFilters] = React.useState<Filters>({ type: 'all', severity: 'all', read: 'all' })
  React.useEffect(() => { fetchAll().catch(() => {}) }, [fetchAll])

  const filtered = items.filter((n) => {
    const byType = filters.type === 'all' || n.type === filters.type
    const bySeverity = filters.severity === 'all' || n.severity === filters.severity
    const byRead = filters.read === 'all' || (filters.read === 'unread' ? !n.read_at : Boolean(n.read_at))
    return byType && bySeverity && byRead
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-white/80 text-sm">Filtrar</div>
        <NotificationFilters filters={filters} onChange={setFilters} />
      </div>
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-white/60 text-sm">Nenhuma notificação para os filtros selecionados.</div>
        ) : (
          filtered.map((n) => (
            <NotificationItem key={n.id} n={n} onOpen={setOpen} />
          ))
        )}
      </div>
      {open && <NotificationDetailsModal n={open} onClose={() => setOpen(null)} />}
    </div>
  )
}