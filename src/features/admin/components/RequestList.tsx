import React from 'react'

type Req = { id: number; type: string; resource: string; resource_id: number; status: string; reason?: string }

export default function RequestList({ requests }: { requests: Req[] }) {
  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <div key={r.id} className="border border-white/10 rounded p-3">
          <div className="text-white text-sm">{r.type} {r.resource} #{r.resource_id}</div>
          <div className="text-white/60 text-xs">Status: {r.status}</div>
          {r.reason ? <div className="text-white/60 text-xs">Motivo: {r.reason}</div> : null}
        </div>
      ))}
    </div>
  )
}