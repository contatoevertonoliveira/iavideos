import React from 'react'

type Req = { id: number; type: string; resource: string; resource_id: number; status: string; reason?: string }

export default function RequestCard({ req, children }: { req: Req; children?: React.ReactNode }) {
  return (
    <div className="border border-white/10 rounded p-3">
      <div className="text-white text-sm">{req.type} {req.resource} #{req.resource_id}</div>
      <div className="text-white/60 text-xs">Status: {req.status}</div>
      {req.reason ? <div className="text-white/60 text-xs">Motivo: {req.reason}</div> : null}
      <div className="mt-2">{children}</div>
    </div>
  )
}