import React, { useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import SwitchGroup from './components/SwitchGroup'

export default function NotificationsSettings() {
  const { loadAll, notifications, updateNotifications, loading } = useSettings()
  const [local, setLocal] = useState<any>(notifications)
  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { setLocal(notifications) }, [notifications])

  const save = async () => { await updateNotifications(local) }

  const switches = [
    { label: 'Performance', key: 'performance' },
    { label: 'Quota', key: 'quota' },
    { label: 'Tokens', key: 'tokens' },
    { label: 'Sugestões IA', key: 'ai_suggestions' },
    { label: 'Sistema', key: 'system' },
  ]

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Notificações & Alertas</h1>
      {loading ? <div>Carregando…</div> : (
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-white/10 rounded p-4">
              <h2 className="font-medium mb-2">Tipos</h2>
              <SwitchGroup
                items={switches.map(s => ({ label: s.label, checked: !!local?.[s.key], onChange: (v: boolean) => setLocal({ ...local, [s.key]: v }) }))}
              />
            </div>
            <div className="border border-white/10 rounded p-4">
              <h2 className="font-medium mb-2">Canais</h2>
              <SwitchGroup
                items={[
                  { label: 'Email', checked: !!local?.channels?.email, onChange: (v: boolean) => setLocal({ ...local, channels: { ...local.channels, email: v } }) },
                  { label: 'Push', checked: !!local?.channels?.push, onChange: (v: boolean) => setLocal({ ...local, channels: { ...local.channels, push: v } }) },
                ]}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm" onClick={save}>Salvar</button>
            <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm">Marcar todas como lidas</button>
            <button className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-sm">Limpar alertas antigos</button>
          </div>
        </div>
      )}
    </div>
  )
}