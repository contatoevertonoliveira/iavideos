import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from './hooks/useSettings'

export default function SettingsHome() {
  const { loadAll, integrations, ai, notifications, preferences, loading } = useSettings()
  useEffect(() => { loadAll() }, [loadAll])
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Configurações do Sistema</h1>
      {loading ? <div>Carregando…</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-white/10 rounded p-4">
            <h2 className="font-medium mb-2">Integrações</h2>
            <div className="text-sm opacity-80">Conectados: {integrations.filter(i => i.status==='active').length} • Expirados: {integrations.filter(i => i.status==='expired').length}</div>
            <Link className="mt-3 inline-block px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm" to="/settings/integrations">Gerenciar</Link>
          </div>
          <div className="border border-white/10 rounded p-4">
            <h2 className="font-medium mb-2">IA & Automação</h2>
            <div className="text-sm opacity-80">Modelo: {ai?.model || '—'} • Temp: {typeof ai?.temperature === 'number' ? ai.temperature.toFixed(2) : '—'}</div>
            <Link className="mt-3 inline-block px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm" to="/settings/ai">Ajustar</Link>
          </div>
          <div className="border border-white/10 rounded p-4">
            <h2 className="font-medium mb-2">Notificações & Alertas</h2>
            <div className="text-sm opacity-80">Email: {notifications?.channels?.email ? 'on' : 'off'} • Push: {notifications?.channels?.push ? 'on' : 'off'}</div>
            <Link className="mt-3 inline-block px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm" to="/settings/notifications">Preferências</Link>
          </div>
          <div className="border border-white/10 rounded p-4">
            <h2 className="font-medium mb-2">Preferências Gerais</h2>
            <div className="text-sm opacity-80">Idioma: {preferences?.language || 'pt-BR'} • Tema: {preferences?.theme || 'auto'}</div>
            <Link className="mt-3 inline-block px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm" to="/settings/preferences">Editar</Link>
          </div>
        </div>
      )}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/settings/security" className="border border-white/10 rounded p-4 hover:border-white/20">
          <div className="font-medium mb-2">Segurança</div>
          <div className="text-sm opacity-80">Revogar sessões, revisar escopos e tokens.</div>
        </Link>
        <Link to="/settings/logs" className="border border-white/10 rounded p-4 hover:border-white/20">
          <div className="font-medium mb-2">Logs & Diagnóstico</div>
          <div className="text-sm opacity-80">Erros, jobs, uploads e exportação CSV/JSON.</div>
        </Link>
      </div>
    </div>
  )
}