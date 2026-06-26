import React from 'react'
import type { Notification } from '../useNotifications'
import { useNotificationsStore } from '../useNotifications'

export default function NotificationItem({ n, onOpen }: { n: Notification; onOpen: (n: Notification) => void }) {
  const markRead = useNotificationsStore((s) => s.markRead)
  const colorBySeverity: Record<string, string> = {
    info: 'border-blue-400/40',
    warning: 'border-amber-400/40',
    error: 'border-red-400/40',
    critical: 'border-red-500/60',
  }
  const iconByType: Record<string, string> = {
    error: '❌', performance: '⚠️', quota: '📊', token: '🔑', system: 'ℹ️'
  }
  return (
    <div className={`rounded-xl border p-3 bg-white/5 text-white ${colorBySeverity[n.severity] || 'border-white/10'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{iconByType[n.type] || '🔔'}</span>
          <div className="font-medium">{n.title}</div>
        </div>
        {!n.read_at && (
          <button className="text-xs px-2 py-1 rounded bg-white/10" onClick={() => markRead(n.id)}>Marcar lida</button>
        )}
      </div>
      <div className="text-sm text-white/80 mt-1">{n.message}</div>
      <div className="mt-2 flex justify-end">
        <button className="text-xs text-[#06B6D4]" onClick={() => onOpen(n)}>Ver detalhes</button>
      </div>
    </div>
  )
}