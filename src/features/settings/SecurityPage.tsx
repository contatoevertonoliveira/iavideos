import React, { useEffect } from 'react'
import { useSettings } from './hooks/useSettings'
import SessionList from './components/SessionList'
import SecurityAlert from './components/SecurityAlert'

export default function SecurityPage() {
  const { sessions, loadSessions, revokeSession, loading } = useSettings()
  useEffect(() => { loadSessions() }, [loadSessions])
  const revokeAll = () => {
    // In a real app, call DELETE bulk endpoint. For now, noop.
    alert('Todas as sessões seriam encerradas (mock).')
  }
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Permissões & Segurança</h1>
      <div className="grid gap-4">
        <SecurityAlert message="Alguns tokens de redes expiram em breve." severity="warning" />
        <div className="border border-white/10 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Sessões Ativas</h2>
            <button className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-sm" onClick={revokeAll}>Encerrar todas</button>
          </div>
          {loading ? <div>Carregando…</div> : <SessionList sessions={sessions} onRevoke={(id) => revokeSession(id)}/>}        
        </div>
        <div className="border border-white/10 rounded p-4">
          <h2 className="font-medium mb-2">2FA</h2>
          <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm">Ativar 2FA</button>
        </div>
      </div>
    </div>
  )
}