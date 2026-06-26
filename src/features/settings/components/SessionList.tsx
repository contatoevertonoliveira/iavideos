import React from 'react'
import type { SessionItem } from '../hooks/useSettings'

type Props = {
  sessions: SessionItem[]
  onRevoke: (id: string) => void
}

export default function SessionList({ sessions, onRevoke }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center justify-between border border-white/10 rounded px-3 py-2">
          <div className="text-sm">
            <div className="font-medium">{s.device}</div>
            <div className="opacity-70">IP: {s.ip} • Último: {new Date(s.last_active).toLocaleString()}</div>
          </div>
          <button className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-sm" onClick={() => onRevoke(s.id)}>Encerrar</button>
        </div>
      ))}
    </div>
  )
}