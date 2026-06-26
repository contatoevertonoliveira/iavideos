import React from 'react'
import { useAuthStore } from '../auth/store'
import { api } from '../../lib/api'

const isMocks = (import.meta as any).env?.VITE_USE_MOCKS === 'true'

export default function BillingSettings() {
  const ctx = useAuthStore((s) => s.ctx)
  const setContext = useAuthStore((s) => s.setContext)
  const siteMode = ctx?.site?.mode ?? 'free'
  const [saving, setSaving] = React.useState(false)

  async function toggleSiteMode() {
    const next = siteMode === 'free' ? 'subscribers' : 'free'
    setSaving(true)
    try {
      if (!isMocks) {
        await api.patch('/api/v1/admin/billing/settings', { site_mode: next, plans_enabled: false })
      }
      const newCtx = { ...(ctx ?? {}), site: { mode: next } }
      setContext(newCtx as any)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Faturamento & Assinaturas</h1>
      <div className="rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Site gratuito (ON/OFF)</div>
            <div className="text-sm text-muted-foreground">Default ON. Alterna modo do site.</div>
          </div>
          <button
            disabled={saving}
            onClick={toggleSiteMode}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
          >
            {siteMode === 'free' ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Básico', 'Moderado', 'Avançado'].map((name) => (
          <div key={name} className="rounded-lg border p-4 opacity-60">
            <div className="font-semibold">Criador {name} <span className="ml-2 text-xs">(Em breve)</span></div>
            <div className="text-sm text-muted-foreground">Planos desativados. Visual apenas.</div>
            <button className="mt-3 px-3 py-1 rounded-md border" disabled>
              Indisponível
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm">
        <div>
          Modo atual do site: <span className="font-medium">{siteMode === 'free' ? 'Gratuito' : 'Assinantes'}</span>
        </div>
        {siteMode === 'free' ? (
          <div className="text-muted-foreground">Atualmente gratuito (definido pelo superAdmin)</div>
        ) : (
          <div className="text-muted-foreground">Disponível para assinantes — em breve</div>
        )}
      </div>
    </div>
  )
}