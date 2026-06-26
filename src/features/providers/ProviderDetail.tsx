import { useParams } from 'react-router-dom'
import { useProviders } from './hooks/useProviders'
import { toastError, toastSuccess } from '@/lib/toast'
import RoutingRules from './components/RoutingRules'
import HealthCard from './components/HealthCard'
import QuotaCard from './components/QuotaCard'
import TestConsole from './components/TestConsole'
import { useState } from 'react'

export default function ProviderDetail() {
  const { id } = useParams()
  const { listQ, updateM } = useProviders()
  const provider = listQ.data?.find(p => String(p.id) === String(id))
  const [tab, setTab] = useState<'geral'|'roteamento'|'saude'|'teste'>('geral')

  if (!provider) return <div className="p-6">Carregando provider...</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{provider.name}</h1>
          <p className="text-sm text-gray-600">Tipo: {provider.kind} • Base URL: <span className="font-mono">{provider.api_base || '-'}</span></p>
        </div>
        <a href="/settings/providers" className="px-3 py-1.5 rounded-md border border-cine bg-cine-surface text-cine hover-cine">Voltar</a>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(['geral','roteamento','saude','teste'] as const).map(t => (
          <button
            key={t}
            className={
              `${tab===t ? 'gradient-cine text-white shadow-cine' : 'bg-cine-surface text-cine border border-cine'} ` +
              'px-3 py-1.5 text-sm rounded-md hover-cine'
            }
            onClick={()=>setTab(t)}
          >
            {t === 'geral' ? 'Geral' : t === 'roteamento' ? 'Roteamento' : t === 'saude' ? 'Saúde & Quota' : 'Teste'}
          </button>
        ))}
      </div>

      {tab==='geral' && (
        <div className="space-y-3">
          <div className="border border-cine rounded p-3 bg-cine-surface-90 text-cine">
            <h3 className="font-medium mb-2">Credenciais</h3>
            <div className="flex items-center justify-between">
              <p>API Key: <span className="font-mono">{provider.api_key ? '•••••••' : '-'}</span></p>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 rounded-md border border-cine bg-cine-surface text-cine hover-cine"
                  onClick={async ()=>{
                    const newKey = window.prompt('Informe a nova API Key (será armazenada com segurança no backend):')
                    if (newKey === null) return
                    try {
                      await updateM.mutateAsync({ id: provider.id, data: { api_key: newKey } })
                      toastSuccess('API Key atualizada')
                    } catch (e: any) {
                      toastError(e?.message || 'Falha ao atualizar a chave')
                    }
                  }}
                >Gerar nova/Atualizar</button>
              </div>
            </div>
          </div>
          <div className="border border-cine rounded p-3 bg-cine-surface-90 text-cine">
            <h3 className="font-medium mb-2">Endpoints & Modelos</h3>
            <pre className="text-xs bg-cine-surface p-2 rounded overflow-auto border border-cine">{JSON.stringify(provider.meta || {}, null, 2)}</pre>
          </div>
        </div>
      )}

      {tab==='roteamento' && (
        <RoutingRules providerId={provider.id} />
      )}

      {tab==='saude' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <HealthCard providerId={provider.id} />
          <QuotaCard providerId={provider.id} />
        </div>
      )}

      {tab==='teste' && (
        <TestConsole provider={provider} />
      )}
    </div>
  )
}