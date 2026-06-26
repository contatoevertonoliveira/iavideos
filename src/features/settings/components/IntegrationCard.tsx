import React from 'react'
import type { IntegrationProvider } from '../hooks/useSettings'
import { GuardedAction } from '@/features/admin/components/GuardedAction'

type Props = {
  item: IntegrationProvider
  onReconnect: (provider: string) => void
  onRevoke: (provider: string) => void
}

export default function IntegrationCard({ item, onReconnect, onRevoke }: Props) {
  const badgeColor = item.status === 'active' ? 'bg-green-600' : item.status === 'expired' ? 'bg-yellow-600' : 'bg-red-600'
  return (
    <div className="border border-white/10 rounded p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${badgeColor}`} aria-label={item.status} />
        <div>
          <div className="font-medium capitalize">{item.provider}</div>
          <div className="text-xs opacity-80">Status: {item.status}</div>
          <div className="text-xs opacity-80">Último refresh: {item.last_refresh ? new Date(item.last_refresh).toLocaleString() : '—'}</div>
          <div className="text-xs opacity-80">Expira: {item.expires_at ? new Date(item.expires_at).toLocaleString() : '—'}</div>
          {item.scopes?.length ? (
            <div className="mt-1 text-xs">
              <span className="opacity-70">Escopos:</span> {item.scopes.join(', ')}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm" onClick={() => onReconnect(item.provider)}>Reconectar</button>
        <GuardedAction action="delete" subject={`integration:${item.provider}`} fallback={<span className="text-white/50 text-xs" title="Requer superAdmin">Revogar indisponível</span>}>
          <button className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-sm" onClick={() => onRevoke(item.provider)}>Revogar</button>
        </GuardedAction>
      </div>
    </div>
  )
}