import React from 'react'

export default function QuotaBar({ remaining, quota_max }: { remaining: number; quota_max: number }) {
  const used = Math.max(0, quota_max - remaining)
  const pct = Math.round((used / quota_max) * 100)
  return (
    <div className="space-y-1">
      <div className="text-xs text-white/70">Uso de quota</div>
      <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
        <div className="h-full bg-[#7C3AED]" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-white/60">{used} / {quota_max} ({pct}%)</div>
    </div>
  )
}