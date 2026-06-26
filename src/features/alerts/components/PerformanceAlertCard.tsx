import React from 'react'

export default function PerformanceAlertCard({ alert }: { alert: { type: string; message: string; severity: string; delta?: number } }) {
  const color = alert.severity === 'critical' ? 'bg-red-500/20 text-red-200' : alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-200' : 'bg-white/10 text-white/80'
  return (
    <div className={`rounded-xl border border-white/10 p-3 ${color}`}>
      <div className="text-sm font-medium">{alert.message}</div>
      {typeof alert.delta === 'number' && (
        <div className="text-xs">Δ {Math.round(alert.delta * 100)}%</div>
      )}
    </div>
  )
}