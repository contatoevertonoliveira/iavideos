import React from 'react'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'

export default function WidgetAlertsSummary() {
  const [stats, setStats] = React.useState<{ total: number; unread: number; critical: number; warning: number; info: number } | null>(null)
  React.useEffect(() => { api.get('/notifications/stats').then((r) => setStats(r.data)).catch(() => setStats(null)) }, [])
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-white/10 p-4 bg-white/5">
        <div className="text-white/80 text-sm">Alertas de Performance</div>
        <div className="text-2xl font-semibold text-white">{stats?.warning ?? 0}</div>
        <Link to="/alerts" className="text-xs text-[#06B6D4]">Ver detalhes</Link>
      </div>
      <div className="rounded-xl border border-white/10 p-4 bg-white/5">
        <div className="text-white/80 text-sm">Quota / API</div>
        <div className="text-2xl font-semibold text-white">{stats ? stats.total - (stats.unread ?? 0) : 0}</div>
        <Link to="/alerts" className="text-xs text-[#06B6D4]">Ver detalhes</Link>
      </div>
      <div className="rounded-xl border border-white/10 p-4 bg-white/5">
        <div className="text-white/80 text-sm">Tokens Expirando</div>
        <div className="text-2xl font-semibold text-white">{stats?.critical ?? 0}</div>
        <Link to="/alerts" className="text-xs text-[#06B6D4]">Ver detalhes</Link>
      </div>
    </div>
  )
}