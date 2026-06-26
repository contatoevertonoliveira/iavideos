import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useProviders } from './hooks/useProviders'
import ProviderFormModal from './ProviderFormModal'
import { toastError, toastSuccess } from '@/lib/toast'
import { api } from '@/lib/api'
import { PIAPI_TEMPLATE } from '../../app/providers/templates'

function StatusDot({ state }: { state?: 'connected' | 'unstable' | 'disconnected' }) {
  const color = state === 'connected' ? 'bg-green-500' : state === 'unstable' ? 'bg-yellow-500' : 'bg-red-500'
  const title = state === 'connected' ? 'Conectado' : state === 'unstable' ? 'Oscilando' : 'Desconectado'
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={title} />
}

export default function ProvidersPage() {
  const { listQ, statusQ, toggleM, updateM, createM } = useProviders()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<null | { id: number; name: string; api_base: string; header_key: string; ping_endpoint: string }>(null)
  const [testingId, setTestingId] = useState<number | null>(null)
  const settingsQ = useQuery<{ id:number; llm_provider_id?:number|null; image_provider_id?:number|null; video_provider_id?:number|null; tts_provider_id?:number|null }>({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
    staleTime: 60_000,
  })
  const [promptInputs, setPromptInputs] = useState<Record<number, string>>({})
  const [globalBase, setGlobalBase] = useState<string>('https://api.piapi.ai')
  const [globalKey, setGlobalKey] = useState<string>('')

  const byIdStatus = useMemo(() => {
    const map = new Map<number, 'connected' | 'unstable' | 'disconnected'>()
    statusQ.data?.forEach(s => map.set(s.id, s.state))
    return map
  }, [statusQ.data])

  const mapKindToTask: Record<string, 'text_gen'|'image_gen'|'video_gen'|'tts'|'stt'> = {
    llm: 'text_gen',
    image: 'image_gen',
    video: 'video_gen',
    tts: 'tts',
    stt: 'stt',
  }

  const getModelOptions = (p: any): string[] => {
    const models: any = p.meta?.models || p.meta?.models_by_task || p.meta?.models
    if (!models) return Array.isArray(p.meta?.models) ? (p.meta?.models as string[]) : []
    if (Array.isArray(models)) return models as string[]
    if (typeof models === 'object') {
      const key = mapKindToTask[p.kind]
      const arr = (models as Record<string, any>)[key]
      return Array.isArray(arr) ? arr : []
    }
    return []
  }

  const setDefaultProviderForKind = async (kind: 'llm'|'image'|'video'|'tts', id: number) => {
    const payload: any = {}
    if (kind === 'llm') payload.llm_provider_id = id
    if (kind === 'image') payload.image_provider_id = id
    if (kind === 'video') payload.video_provider_id = id
    if (kind === 'tts') payload.tts_provider_id = id
    try {
      await api.put('/settings', payload)
      toastSuccess('Default do sistema atualizado')
      settingsQ.refetch()
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao definir default do sistema')
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, any[]>()
    (listQ.data || []).forEach((p:any) => {
      const g = p.meta?.group
      if (g) {
        if (!map.has(g)) map.set(g, [])
        map.get(g)!.push(p)
      }
    })
    return map
  }, [listQ.data])

  return (
    <div className="p-6 space-y-4">
      {/* Seção: Aplicar Template PiAPI Globalmente */}
      <div className="rounded border border-white/10 p-3">
        <div className="font-medium mb-2">Aplicar Template Global (PiAPI)</div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-cine-muted">Base URL</label>
            <input className="px-2 py-1 text-xs rounded bg-cine-surface border border-cine text-cine" value={globalBase} onChange={(e)=>setGlobalBase(e.target.value)} placeholder="https://api.piapi.ai" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-cine-muted">API Key (X-API-Key)</label>
            <input className="px-2 py-1 text-xs rounded bg-cine-surface border border-cine text-cine" value={globalKey} onChange={(e)=>setGlobalKey(e.target.value)} placeholder="chave da PiAPI" />
          </div>
          <button
            className="px-3 py-1.5 text-xs rounded-md gradient-cine text-white shadow-cine hover-cine"
            onClick={async () => {
              try {
                if (!globalBase || !globalKey) {
                  toastError('Informe Base URL e API Key')
                  return
                }
                const caps = Object.keys(PIAPI_TEMPLATE.models).filter((k) => {
                  const arr = (PIAPI_TEMPLATE.models as any)[k]
                  return Array.isArray(arr) && arr.length > 0
                })
                const modelByKind: Record<'llm'|'image'|'video'|'tts','text_gen'|'image_gen'|'video_gen'|'tts'> = {
                  llm: 'text_gen', image: 'image_gen', video: 'video_gen', tts: 'tts'
                }
                const kinds: Array<'llm'|'image'|'video'|'tts'> = ['llm','image','video','tts']
                for (const kind of kinds) {
                  const existing = (listQ.data || []).find(p => p.kind === kind && (p.meta?.template === 'piapi' || /piapi/i.test(p.name)))
                  const models = (PIAPI_TEMPLATE.models as any)[modelByKind[kind]] as string[] || []
                  const default_model = Array.isArray(models) && models.length > 0 ? models[0] : ''
                  const metaPatch = {
                    ...(existing?.meta || {}),
                    group: 'PiAPI',
                    template: 'piapi',
                    header_key: PIAPI_TEMPLATE.header_key,
                    endpoints: PIAPI_TEMPLATE.endpoints,
                    create_endpoint: '/api/v1/task',
                    get_task_endpoint: '/api/v1/task',
                    capabilities: caps,
                    models: PIAPI_TEMPLATE.models,
                    default_model,
                  }
                  if (existing) {
                    await updateM.mutateAsync({ id: existing.id, data: { name: existing.name, kind, api_base: globalBase, api_key: globalKey, meta: metaPatch, enabled: true } })
                    await setDefaultProviderForKind(kind, existing.id)
                  } else {
                    const created = await createM.mutateAsync({ name: `PiAPI (${kind})`, kind, api_base: globalBase, api_key: globalKey, meta: metaPatch, enabled: true }) as any
                    if (created?.id) await setDefaultProviderForKind(kind, created.id)
                  }
                }
                toastSuccess('Template PiAPI aplicada globalmente. Defaults atualizados.')
                listQ.refetch(); statusQ.refetch(); settingsQ.refetch()
              } catch (err:any) {
                toastError(err?.response?.data?.detail || 'Falha ao aplicar template global')
              }
            }}
          >Aplicar global</button>
        </div>
        <div className="text-xs text-white/50 mt-2">Conforme docs: headers usam X-API-Key; endpoints unificados em /api/v1/task para criação e consulta.</div>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Providers de IA</h1>
        <button className="px-3 py-1.5 rounded-md gradient-cine text-white shadow-cine hover-cine" onClick={() => setOpen(true)}>Adicionar API</button>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full">
          <thead>
            <tr className="text-left">
              <th className="p-3">Nome</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Base URL</th>
              <th className="p-3">Status</th>
              <th className="p-3">Capacidades</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {listQ.data?.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  {editing?.id === p.id ? (
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  ) : (
                    p.name
                  )}
                </td>
                <td className="p-3 uppercase">{p.kind}</td>
                <td className="p-3 font-mono text-sm">
                  {editing?.id === p.id ? (
                    <input
                      className="w-full border rounded px-2 py-1 text-sm font-mono"
                      value={editing.api_base}
                      onChange={(e) => setEditing({ ...editing, api_base: e.target.value })}
                      placeholder="https://api.exemplo.com"
                    />
                  ) : (
                    p.api_base || '-'
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <StatusDot state={byIdStatus.get(p.id)} />
                    <span className="text-sm">{byIdStatus.get(p.id) ?? '—'}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(p.meta?.capabilities ?? [p.kind])
                      .map((c: string) => (
                        <span key={c} className="px-2 py-0.5 text-xs bg-gray-100 rounded">{c}</span>
                      ))}
                    {editing?.id === p.id && (
                      <div className="mt-2 w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600">Ping endpoint</label>
                          <input
                            className="w-full border rounded px-2 py-1 text-sm font-mono"
                            value={editing.ping_endpoint}
                            onChange={(e) => setEditing({ ...editing, ping_endpoint: e.target.value })}
                            placeholder="/"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Header key</label>
                          <input
                            className="w-full border rounded px-2 py-1 text-sm font-mono"
                            value={editing.header_key}
                            onChange={(e) => setEditing({ ...editing, header_key: e.target.value })}
                            placeholder="X-API-Key"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {editing?.id === p.id ? (
                      <>
                        <button
                          className="px-2 py-1 text-xs rounded-md gradient-cine text-white shadow-cine hover-cine"
                          onClick={async () => {
                            try {
                              await updateM.mutateAsync({ id: p.id, data: { name: editing.name, api_base: editing.api_base, meta: { ...(p.meta || {}), header_key: editing.header_key, ping_endpoint: editing.ping_endpoint } } })
                              toastSuccess('Provider atualizado')
                              setEditing(null)
                              listQ.refetch()
                            } catch (e: any) {
                              toastError(e?.response?.data?.detail || 'Falha ao atualizar provider')
                            }
                          }}
                        >Salvar</button>
                        <button className="px-2 py-1 text-xs rounded-md border border-cine bg-cine-surface text-cine hover-cine" onClick={() => setEditing(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <a className="px-2 py-1 text-xs rounded-md border border-cine bg-cine-surface text-cine hover-cine" href={`/settings/providers/${p.id}`}>Detalhe</a>
                        <button className="px-2 py-1 text-xs rounded-md border border-cine bg-cine-surface text-cine hover-cine" onClick={() => toggleM.mutate(p.id)}>
                          {p.enabled ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          className="btn btn-xs"
                          onClick={() => setEditing({ id: p.id, name: p.name, api_base: p.api_base || '', header_key: (p.meta?.header_key as string) || 'X-API-Key', ping_endpoint: (p.meta?.ping_endpoint as string) || '/' })}
                        >Editar</button>
                        <button
                          className="btn btn-xs"
                          disabled={testingId === p.id}
                          onClick={async () => {
                            try {
                              setTestingId(p.id)
                              const res = await api.get('/providers/status', { params: { only_enabled: false } })
                              const st = (res.data as any[])?.find((s: any) => String(s.id) === String(p.id))?.state
                              const title = st === 'connected' ? 'Conectado' : st === 'unstable' ? 'Oscilando' : 'Desconectado'
                              toastSuccess(`Status atualizado: ${title}`)
                              statusQ.refetch()
                            } catch (e: any) {
                              toastError(e?.response?.data?.detail || 'Falha ao testar conexão')
                            } finally {
                              setTestingId(null)
                            }
                          }}
                        >Testar conexão</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <ProviderFormModal onClose={() => setOpen(false)} />
      )}

      <div className="mt-6 space-y-8">
        {/* Seção: APIs multi-IA em tabelas por capacidade */}
        <div>
          <h2 className="text-lg font-semibold">APIs multi-IA</h2>
          {([
            { kind: 'llm' as const, title: 'Tabela (IA para Texto)' },
            { kind: 'image' as const, title: 'Tabela (IA para Imagem)' },
            { kind: 'video' as const, title: 'Tabela (IA para Vídeo)' },
            { kind: 'tts' as const, title: 'Tabela (IA para Som)' },
          ]).map(({ kind, title }) => {
            const rows = (listQ.data || []).filter((p:any) => p.kind === kind && p.meta?.group)
            return (
              <div key={`multi-${kind}`} className="mt-4 border rounded-md overflow-x-auto">
                <div className="p-3 border-b font-medium">{title}</div>
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">API Principal</th>
                      <th className="p-2">Modelo</th>
                      <th className="p-2">Status Conexão</th>
                      <th className="p-2">Ajustes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr><td className="p-3 text-sm text-gray-500" colSpan={4}>Nenhum provider multi-IA configurado para esta capacidade.</td></tr>
                    )}
                    {rows.map((p:any) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{p.meta?.group || p.name}</span>
                            {p.meta?.group && <span className="text-xs text-gray-500">Provider: {p.name}</span>}
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            className="select select-xs"
                            value={p.meta?.default_model || ''}
                            onChange={async (e) => {
                              const val = e.target.value
                              try {
                                await updateM.mutateAsync({ id: p.id, data: { meta: { ...(p.meta || {}), default_model: val } } })
                                toastSuccess('Modelo padrão atualizado')
                                listQ.refetch()
                              } catch (err:any) {
                                toastError(err?.response?.data?.detail || 'Falha ao salvar modelo padrão')
                              }
                            }}
                          >
                            <option value="">Selecione</option>
                            {getModelOptions(p).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <StatusDot state={byIdStatus.get(p.id)} />
                            <span className="text-xs">{byIdStatus.get(p.id) ?? '—'}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <a className="btn btn-xs" href={`/settings/providers/${p.id}`}>Editar</a>
                            <button
                              className="btn btn-xs btn-accent"
                              onClick={async () => {
                                try {
                                  const caps = Object.keys(PIAPI_TEMPLATE.models).filter((k) => {
                                    const arr = (PIAPI_TEMPLATE.models as any)[k]
                                    return Array.isArray(arr) && arr.length > 0
                                  })
                                  const metaPatch = {
                                    ...(p.meta || {}),
                                    template: 'piapi',
                                    header_key: PIAPI_TEMPLATE.header_key,
                                    endpoints: PIAPI_TEMPLATE.endpoints,
                                    create_endpoint: '/api/v1/task',
                                    get_task_endpoint: '/api/v1/task',
                                    capabilities: caps,
                                    models: PIAPI_TEMPLATE.models,
                                  }
                                  await updateM.mutateAsync({ id: p.id, data: { meta: metaPatch } })
                                  toastSuccess('Template PiAPI aplicado ao provider')
                                  listQ.refetch(); statusQ.refetch()
                                } catch (err:any) {
                                  toastError(err?.response?.data?.detail || 'Falha ao aplicar template')
                                }
                              }}
                            >Aplicar template</button>
                            {(() => {
                              const current = settingsQ.data?.[
                                kind === 'llm' ? 'llm_provider_id' : kind === 'image' ? 'image_provider_id' : kind === 'video' ? 'video_provider_id' : 'tts_provider_id'
                              ]
                              const isDefault = Number(current) === Number(p.id)
                              return (
                                <button className={`btn btn-xs ${isDefault ? 'btn-primary' : ''}`} onClick={() => setDefaultProviderForKind(kind, p.id)}>
                                  {isDefault ? 'Default' : 'Default'}
                                </button>
                              )
                            })()}
                            <button
                              className="btn btn-xs"
                              onClick={async () => {
                                try {
                                  await api.delete(`/providers/${p.id}`)
                                  toastSuccess('Provider excluído')
                                  listQ.refetch(); settingsQ.refetch(); statusQ.refetch()
                                } catch (e:any) {
                                  toastError(e?.response?.data?.detail || 'Falha ao excluir provider')
                                }
                              }}
                            >Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>

        {/* Seção: APIs individuais em tabelas por capacidade */}
        <div>
          <h2 className="text-lg font-semibold">APIs individuais</h2>
          {([
            { kind: 'llm' as const, title: 'Tabela (IA para Texto)' },
            { kind: 'image' as const, title: 'Tabela (IA para Imagem)' },
            { kind: 'video' as const, title: 'Tabela (IA para Vídeo)' },
            { kind: 'tts' as const, title: 'Tabela (IA para Som)' },
          ]).map(({ kind, title }) => {
            const rows = (listQ.data || []).filter((p:any) => p.kind === kind && !p.meta?.group)
            return (
              <div key={`single-${kind}`} className="mt-4 border rounded-md overflow-x-auto">
                <div className="p-3 border-b font-medium">{title}</div>
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">API Principal</th>
                      <th className="p-2">Modelo</th>
                      <th className="p-2">Status Conexão</th>
                      <th className="p-2">Ajustes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr><td className="p-3 text-sm text-gray-500" colSpan={4}>Nenhum provider individual configurado para esta capacidade.</td></tr>
                    )}
                    {rows.map((p:any) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">
                          <select
                            className="select select-xs"
                            value={p.meta?.default_model || ''}
                            onChange={async (e) => {
                              const val = e.target.value
                              try {
                                await updateM.mutateAsync({ id: p.id, data: { meta: { ...(p.meta || {}), default_model: val } } })
                                toastSuccess('Modelo padrão atualizado')
                                listQ.refetch()
                              } catch (err:any) {
                                toastError(err?.response?.data?.detail || 'Falha ao salvar modelo padrão')
                              }
                            }}
                          >
                            <option value="">Selecione</option>
                            {getModelOptions(p).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <StatusDot state={byIdStatus.get(p.id)} />
                            <span className="text-xs">{byIdStatus.get(p.id) ?? '—'}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <a className="btn btn-xs" href={`/settings/providers/${p.id}`}>Editar</a>
                            <button
                              className="btn btn-xs btn-accent"
                              onClick={async () => {
                                try {
                                  const caps = Object.keys(PIAPI_TEMPLATE.models).filter((k) => {
                                    const arr = (PIAPI_TEMPLATE.models as any)[k]
                                    return Array.isArray(arr) && arr.length > 0
                                  })
                                  const metaPatch = {
                                    ...(p.meta || {}),
                                    template: 'piapi',
                                    header_key: PIAPI_TEMPLATE.header_key,
                                    endpoints: PIAPI_TEMPLATE.endpoints,
                                    create_endpoint: '/api/v1/task',
                                    get_task_endpoint: '/api/v1/task',
                                    capabilities: caps,
                                    models: PIAPI_TEMPLATE.models,
                                  }
                                  await updateM.mutateAsync({ id: p.id, data: { meta: metaPatch } })
                                  toastSuccess('Template PiAPI aplicado ao provider')
                                  listQ.refetch(); statusQ.refetch()
                                } catch (err:any) {
                                  toastError(err?.response?.data?.detail || 'Falha ao aplicar template')
                                }
                              }}
                            >Aplicar template</button>
                            {(() => {
                              const current = settingsQ.data?.[
                                kind === 'llm' ? 'llm_provider_id' : kind === 'image' ? 'image_provider_id' : kind === 'video' ? 'video_provider_id' : 'tts_provider_id'
                              ]
                              const isDefault = Number(current) === Number(p.id)
                              return (
                                <button className={`btn btn-xs ${isDefault ? 'btn-primary' : ''}`} onClick={() => setDefaultProviderForKind(kind, p.id)}>
                                  {isDefault ? 'Default' : 'Default'}
                                </button>
                              )
                            })()}
                            <button
                              className="btn btn-xs"
                              onClick={async () => {
                                try {
                                  await api.delete(`/providers/${p.id}`)
                                  toastSuccess('Provider excluído')
                                  listQ.refetch(); settingsQ.refetch(); statusQ.refetch()
                                } catch (e:any) {
                                  toastError(e?.response?.data?.detail || 'Falha ao excluir provider')
                                }
                              }}
                            >Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}