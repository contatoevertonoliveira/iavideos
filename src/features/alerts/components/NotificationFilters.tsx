import React from 'react'

export type Filters = {
  type: string
  severity: string
  read: string
}

export default function NotificationFilters({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }
  return (
    <div className="flex flex-wrap gap-2">
      <select className="bg-white/5 border border-white/10 text-white text-sm rounded-md px-2 py-1" value={filters.type} onChange={(e) => set('type', e.target.value)}>
        <option value="all">Todos</option>
        <option value="system">Sistema</option>
        <option value="error">Erros</option>
        <option value="performance">Performance</option>
        <option value="quota">Quota</option>
        <option value="token">Tokens</option>
      </select>
      <select className="bg-white/5 border border-white/10 text-white text-sm rounded-md px-2 py-1" value={filters.severity} onChange={(e) => set('severity', e.target.value)}>
        <option value="all">Todos</option>
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="critical">Critical</option>
      </select>
      <select className="bg-white/5 border border-white/10 text-white text-sm rounded-md px-2 py-1" value={filters.read} onChange={(e) => set('read', e.target.value)}>
        <option value="all">Todas</option>
        <option value="unread">Não lidas</option>
        <option value="read">Lidas</option>
      </select>
    </div>
  )
}