import React, { useEffect } from 'react'
import { useSettings } from './hooks/useSettings'
import IntegrationCard from './components/IntegrationCard'
import { useSSE } from '@/lib/useSSE'
import { api } from '@/lib/api'

export default function IntegrationsPage() {
  const { loadAll, integrations, reconnect, revoke, loading, setIntegrationStatus } = useSettings()
  useEffect(() => { loadAll() }, [loadAll])

  // Conectar SSE para refletir expiração de tokens dinamicamente
  const sseUrl = `${api.defaults.baseURL ?? ''}/sse/stream`
  useSSE({
    url: sseUrl,
    onEvent: (evt: any) => {
      if (evt?.type === 'token_expired') {
        const prov = evt?.provider || evt?.account
        if (prov && typeof prov === 'string') {
          setIntegrationStatus(prov, 'expired')
        }
      }
    },
  })

  // Utilitário para E2E: permitir disparar eventos SSE via window
  useEffect(() => {
    // @ts-expect-error opt-in helper for e2e
    window.__emitSSE = (evt: any) => {
      if (evt?.type === 'token_expired' && evt?.provider) {
        setIntegrationStatus(evt.provider, 'expired')
      }
    }
    return () => {
      // @ts-expect-error cleanup
      delete window.__emitSSE
    }
  }, [setIntegrationStatus])
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Integrações & APIs</h1>
      {loading ? <div>Carregando…</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((p) => (
            <IntegrationCard key={p.provider} item={p} onReconnect={() => reconnect(p.provider)} onRevoke={() => revoke(p.provider)} />
          ))}
        </div>
      )}
    </div>
  )
}