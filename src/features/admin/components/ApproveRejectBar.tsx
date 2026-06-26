import React from 'react'

export default function ApproveRejectBar({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div className="d-flex gap-2">
      <button className="btn btn-outline-light btn-sm rounded-3" onClick={onApprove}>Aprovar</button>
      <button className="btn btn-outline-danger btn-sm rounded-3" onClick={onReject}>Rejeitar</button>
    </div>
  )
}