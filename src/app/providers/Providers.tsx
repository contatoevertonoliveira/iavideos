import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PIAPI_TEMPLATE, DEFAULT_ENDPOINTS as DEFAULT_EP, applyTemplateToState } from './templates'
import { api } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'

type Provider = {
  id: number
  name: string
  kind: 'llm' | 'image' | 'video' | 'tts' | 'stt'
  enabled: boolean
  api_base?: string | null
  api_key?: string | null
  meta?: Record<string, any>
}

type SettingsResp = {
  id: number
  llm_provider_id?: number | null
  image_provider_id?: number | null
  video_provider_id?: number | null
  tts_provider_id?: number | null
}

export default function Providers() {
  const qc = useQueryClient()

  const settingsQ = useQuery<SettingsResp>({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
    staleTime: 60_000,
  })

  const llmProvidersQ = useQuery<Provider[]>({
    queryKey: ['providers', 'llm'],
    queryFn: async () => (await api.get('/providers', { params: { kind: 'llm', include_key: true } })).data,
    staleTime: 60_000,
  })
  const imageProvidersQ = useQuery<Provider[]>({
    queryKey: ['providers', 'image'],
    queryFn: async () => (await api.get('/providers', { params: { kind: 'image', include_key: true } })).data,
    staleTime: 60_000,
  })
  const videoProvidersQ = useQuery<Provider[]>({
    queryKey: ['providers', 'video'],
    queryFn: async () => (await api.get('/providers', { params: { kind: 'video', include_key: true } })).data,
    staleTime: 60_000,
  })
  const ttsProvidersQ = useQuery<Provider[]>({
    queryKey: ['providers', 'tts'],
    queryFn: async () => (await api.get('/providers', { params: { kind: 'tts', include_key: true } })).data,
    staleTime: 60_000,
  })

  type ProviderStatus = { id: number; state: 'connected' | 'disconnected' | 'unstable' }
  const providersStatusQ = useQuery<ProviderStatus[]>({
    queryKey: ['providers', 'status'],
    queryFn: async () => (await api.get('/providers/status')).data,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const [testingId, setTestingId] = useState<number | null>(null)

  const updateSettingsM = useMutation({
    mutationFn: async (body: Partial<SettingsResp>) => (await api.put('/settings', body)).data,
    onSuccess: () => {
      toastSuccess('Configurações atualizadas')
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao atualizar configurações'),
  })

  const createProviderM = useMutation({
    mutationFn: async (body: { name: string; kind: Provider['kind']; api_base?: string; api_key?: string; meta?: Record<string, any>; enabled?: boolean }) =>
      (await api.post('/providers', body)).data,
    onSuccess: () => {
      toastSuccess('Provider criado com sucesso')
      qc.invalidateQueries({ queryKey: ['providers', 'llm'] })
      qc.invalidateQueries({ queryKey: ['providers', 'image'] })
      qc.invalidateQueries({ queryKey: ['providers', 'video'] })
      qc.invalidateQueries({ queryKey: ['providers', 'tts'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao criar provider'),
  })

  const updateProviderM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Pick<Provider, 'name' | 'api_base' | 'api_key' | 'enabled' | 'meta'>> }) =>
      (await api.put(`/providers/${id}`, data)).data,
    onSuccess: (res: Provider) => {
      toastSuccess('Provider atualizado')
      qc.invalidateQueries({ queryKey: ['providers', res.kind] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao atualizar provider'),
  })

  const toggleProviderM = useMutation({
    mutationFn: async (id: number) => (await api.patch(`/providers/${id}/toggle`)).data,
    onSuccess: (res: Provider) => {
      toastSuccess(res.enabled ? 'Provider ativado' : 'Provider desativado')
      qc.invalidateQueries({ queryKey: ['providers', res.kind] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao alternar provider'),
  })

  const deleteProviderM = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/providers/${id}`)).data,
    onSuccess: () => {
      toastSuccess('Provider excluído')
      qc.invalidateQueries({ queryKey: ['providers', 'llm'] })
      qc.invalidateQueries({ queryKey: ['providers', 'image'] })
      qc.invalidateQueries({ queryKey: ['providers', 'video'] })
      qc.invalidateQueries({ queryKey: ['providers', 'tts'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao excluir provider'),
  })

  // Modal para adicionar API de IA
  const [isProviderModalOpen, setProviderModalOpen] = useState(false)
  const [providerMode, setProviderMode] = useState<'multi' | 'single'>('multi')
  const [apiName, setApiName] = useState('')
  const [apiBase, setApiBase] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [headerKey, setHeaderKey] = useState('X-API-Key')
  const [useLLM, setUseLLM] = useState(true)
  const [useImage, setUseImage] = useState(false)
  const [useVideo, setUseVideo] = useState(false)
  const [useTTS, setUseTTS] = useState(false)
  const [modelsLLM, setModelsLLM] = useState('')
  const [modelsImage, setModelsImage] = useState('')
  const [modelsVideo, setModelsVideo] = useState('')
  const [modelsTTS, setModelsTTS] = useState('')
  const [defaultLLM, setDefaultLLM] = useState('')
  const [defaultImage, setDefaultImage] = useState('')
  const [defaultVideo, setDefaultVideo] = useState('')
  const [defaultTTS, setDefaultTTS] = useState('')
  // Modelos descobertos (modo multi)
  const [discoveredLLM, setDiscoveredLLM] = useState<string[]>([])
  const [discoveredImage, setDiscoveredImage] = useState<string[]>([])
  const [discoveredVideo, setDiscoveredVideo] = useState<string[]>([])
  const [discoveredTTS, setDiscoveredTTS] = useState<string[]>([])

  // IA única: permitir ativar uma API distinta por categoria
  const [singleLLMEnabled, setSingleLLMEnabled] = useState(false)
  const [singleLLMName, setSingleLLMName] = useState('')
  const [singleLLMBase, setSingleLLMBase] = useState('')
  const [singleLLMKey, setSingleLLMKey] = useState('')
  const [singleLLMDefault, setSingleLLMDefault] = useState('')
  const [singleLLMModels, setSingleLLMModels] = useState<string[]>([])

  const [singleImageEnabled, setSingleImageEnabled] = useState(false)
  const [singleImageName, setSingleImageName] = useState('')
  const [singleImageBase, setSingleImageBase] = useState('')
  const [singleImageKey, setSingleImageKey] = useState('')
  const [singleImageDefault, setSingleImageDefault] = useState('')
  const [singleImageModels, setSingleImageModels] = useState<string[]>([])

  const [singleVideoEnabled, setSingleVideoEnabled] = useState(false)
  const [singleVideoName, setSingleVideoName] = useState('')
  const [singleVideoBase, setSingleVideoBase] = useState('')
  const [singleVideoKey, setSingleVideoKey] = useState('')
  const [singleVideoDefault, setSingleVideoDefault] = useState('')
  const [singleVideoModels, setSingleVideoModels] = useState<string[]>([])

  const [singleTTSEnabled, setSingleTTSEnabled] = useState(false)
  const [singleTTSName, setSingleTTSName] = useState('')
  const [singleTTSBase, setSingleTTSBase] = useState('')
  const [singleTTSKey, setSingleTTSKey] = useState('')
  const [singleTTSDefault, setSingleTTSDefault] = useState('')
  const [singleTTSModels, setSingleTTSModels] = useState<string[]>([])

  const parseModels = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
  // Descoberta de modelos na API base (modo multi)
  const discoverGlobal = async () => {
    try {
      const res = await api.post('/ai/providers/discover', { api_base: apiBase, api_key: apiKey, header_key: headerKey, name: apiName || 'API' })
      const prov = res.data?.provider || {}
      const models = prov?.models || {}
      const llm = Array.isArray(models?.text_gen) ? models.text_gen : []
      const image = Array.isArray(models?.image_gen) ? models.image_gen : []
      const video = Array.isArray(models?.video_gen) ? models.video_gen : []
      const tts = Array.isArray(models?.tts) ? models.tts : []
      setDiscoveredLLM(llm)
      setDiscoveredImage(image)
      setDiscoveredVideo(video)
      setDiscoveredTTS(tts)
      setModelsLLM(llm.join(', '))
      setModelsImage(image.join(', '))
      setModelsVideo(video.join(', '))
      setModelsTTS(tts.join(', '))
      if (llm.length > 0) setDefaultLLM(llm[0])
      if (image.length > 0) setDefaultImage(image[0])
      if (video.length > 0) setDefaultVideo(video[0])
      if (tts.length > 0) setDefaultTTS(tts[0])
      toastSuccess('Modelos descobertos da API')
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao descobrir modelos da API')
    }
  }
  // Descoberta por categoria (modo single)
  const discoverForSingle = async (kind: Provider['kind'], base: string, key: string) => {
    try {
      const res = await api.post('/ai/providers/discover', { api_base: base, api_key: key, header_key: headerKey, name: 'Single-'+kind })
      const models = res.data?.provider?.models || {}
      const llm = Array.isArray(models?.text_gen) ? models.text_gen : []
      const image = Array.isArray(models?.image_gen) ? models.image_gen : []
      const video = Array.isArray(models?.video_gen) ? models.video_gen : []
      const tts = Array.isArray(models?.tts) ? models.tts : []
      if (kind === 'llm') {
        setSingleLLMModels(llm)
        if (llm.length > 0) setSingleLLMDefault(llm[0])
      }
      if (kind === 'image') {
        setSingleImageModels(image)
        if (image.length > 0) setSingleImageDefault(image[0])
      }
      if (kind === 'video') {
        setSingleVideoModels(video)
        if (video.length > 0) setSingleVideoDefault(video[0])
      }
      if (kind === 'tts') {
        setSingleTTSModels(tts)
        if (tts.length > 0) setSingleTTSDefault(tts[0])
      }
      toastSuccess('Modelos descobertos para ' + (kind === 'llm' ? 'LLM' : kind === 'image' ? 'Imagem' : kind === 'video' ? 'Vídeo' : 'TTS'))
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao descobrir modelos')
    }
  }
  const DEFAULT_ENDPOINTS: Record<string, string> = DEFAULT_EP

  const createMultiProviders = async () => {
    const metaCommon = { group: apiName, header_key: headerKey, endpoints: DEFAULT_ENDPOINTS }
    const defaultsToSet: Partial<SettingsResp> = {}
    if (useLLM) {
      const models = discoveredLLM.length > 0 ? discoveredLLM : parseModels(modelsLLM)
      const res = await createProviderM.mutateAsync({ name: `${apiName} (LLM)`, kind: 'llm', api_base: apiBase, api_key: apiKey, meta: { ...metaCommon, capabilities: ['text_gen'], models: { text_gen: models }, default_model: defaultLLM }, enabled: true })
      defaultsToSet.llm_provider_id = res.id
    }
    if (useImage) {
      const models = discoveredImage.length > 0 ? discoveredImage : parseModels(modelsImage)
      const res = await createProviderM.mutateAsync({ name: `${apiName} (Imagem)`, kind: 'image', api_base: apiBase, api_key: apiKey, meta: { ...metaCommon, capabilities: ['image_gen'], models: { image_gen: models }, default_model: defaultImage }, enabled: true })
      defaultsToSet.image_provider_id = res.id
    }
    if (useVideo) {
      const models = discoveredVideo.length > 0 ? discoveredVideo : parseModels(modelsVideo)
      const res = await createProviderM.mutateAsync({ name: `${apiName} (Vídeo)`, kind: 'video', api_base: apiBase, api_key: apiKey, meta: { ...metaCommon, capabilities: ['video_gen'], models: { video_gen: models }, default_model: defaultVideo }, enabled: true })
      defaultsToSet.video_provider_id = res.id
    }
    if (useTTS) {
      const models = discoveredTTS.length > 0 ? discoveredTTS : parseModels(modelsTTS)
      const res = await createProviderM.mutateAsync({ name: `${apiName} (TTS)`, kind: 'tts', api_base: apiBase, api_key: apiKey, meta: { ...metaCommon, capabilities: ['tts'], models: { tts: models }, default_model: defaultTTS }, enabled: true })
      defaultsToSet.tts_provider_id = res.id
    }
    if (Object.keys(defaultsToSet).length > 0) {
      await updateSettingsM.mutateAsync(defaultsToSet)
      toastSuccess('Defaults atualizados para a API adicionada')
    }
    setProviderModalOpen(false)
    setApiName(''); setApiBase(''); setApiKey('')
  }

  const createSingleProvidersBatch = async () => {
    const updates: Partial<SettingsResp> = {}
    if (singleLLMEnabled) {
      const res = await createProviderM.mutateAsync({ name: singleLLMName || 'LLM', kind: 'llm', api_base: singleLLMBase, api_key: singleLLMKey, meta: { single_api: true, header_key: headerKey, endpoints: DEFAULT_ENDPOINTS, capabilities: ['text_gen'], models: { text_gen: singleLLMModels }, default_model: singleLLMDefault }, enabled: true })
      updates.llm_provider_id = res.id
    }
    if (singleImageEnabled) {
      const res = await createProviderM.mutateAsync({ name: singleImageName || 'Imagem', kind: 'image', api_base: singleImageBase, api_key: singleImageKey, meta: { single_api: true, header_key: headerKey, endpoints: DEFAULT_ENDPOINTS, capabilities: ['image_gen'], models: { image_gen: singleImageModels }, default_model: singleImageDefault }, enabled: true })
      updates.image_provider_id = res.id
    }
    if (singleVideoEnabled) {
      const res = await createProviderM.mutateAsync({ name: singleVideoName || 'Vídeo', kind: 'video', api_base: singleVideoBase, api_key: singleVideoKey, meta: { single_api: true, header_key: headerKey, endpoints: DEFAULT_ENDPOINTS, capabilities: ['video_gen'], models: { video_gen: singleVideoModels }, default_model: singleVideoDefault }, enabled: true })
      updates.video_provider_id = res.id
    }
    if (singleTTSEnabled) {
      const res = await createProviderM.mutateAsync({ name: singleTTSName || 'TTS', kind: 'tts', api_base: singleTTSBase, api_key: singleTTSKey, meta: { single_api: true, header_key: headerKey, endpoints: DEFAULT_ENDPOINTS, capabilities: ['tts'], models: { tts: singleTTSModels }, default_model: singleTTSDefault }, enabled: true })
      updates.tts_provider_id = res.id
    }
    if (Object.keys(updates).length > 0) {
      await updateSettingsM.mutateAsync(updates)
      toastSuccess('APIs únicas adicionadas e definidas como padrão por categoria')
    }
    setProviderModalOpen(false)
  }

  const haveLLM = Boolean(settingsQ.data?.llm_provider_id)
  const haveImage = Boolean(settingsQ.data?.image_provider_id)
  const haveVideo = Boolean(settingsQ.data?.video_provider_id)
  const haveTTS = Boolean(settingsQ.data?.tts_provider_id)
  const missing: string[] = []
  if (!haveLLM) missing.push('Texto (LLM)')
  if (!haveImage) missing.push('Imagem')
  if (!haveVideo) missing.push('Vídeo')
  if (!haveTTS) missing.push('TTS')

  const [editing, setEditing] = useState<{ id: number; name: string; api_base?: string; api_key?: string; kind: Provider['kind']; default_model?: string } | null>(null)

  const getModelOptions = (p: Provider): string[] => {
    const models: any = p.meta?.models
    if (Array.isArray(models)) return models
    if (models && typeof models === 'object') {
      const map: Record<string, string> = { llm: 'text_gen', image: 'image_gen', video: 'video_gen', tts: 'tts', stt: 'stt' }
      const key = map[p.kind]
      const arr = (models as Record<string, any>)[key]
      return Array.isArray(arr) ? arr : []
    }
    return []
  }

  const discoverModelsForProvider = async (p: Provider) => {
    try {
      const res = await api.post('/ai/providers/discover', { api_base: p.api_base, api_key: p.api_key, header_key: p.meta?.header_key || 'X-API-Key', name: p.meta?.group || p.name })
      const prov = res.data?.provider || {}
      const metaPatch = {
        ...(p.meta || {}),
        endpoints: prov.endpoints || DEFAULT_ENDPOINTS,
        capabilities: Array.isArray(prov.capabilities) ? prov.capabilities : [],
        models: prov.models || {},
      }
      await updateProviderM.mutateAsync({ id: p.id, data: { meta: metaPatch } })
      toastSuccess('Modelos atualizados para o provider')
      qc.invalidateQueries({ queryKey: ['providers', p.kind] })
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao buscar modelos do provider')
    }
  }

  const setDefaultForKind = async (kind: Provider['kind'], id: number) => {
    const payload: Partial<SettingsResp> = {}
    if (kind === 'llm') payload.llm_provider_id = id
    if (kind === 'image') payload.image_provider_id = id
    if (kind === 'video') payload.video_provider_id = id
    if (kind === 'tts') payload.tts_provider_id = id
    await updateSettingsM.mutateAsync(payload)
  }

  const clearDefaultForKind = async (kind: Provider['kind']) => {
    const payload: Partial<SettingsResp> = {}
    if (kind === 'llm') payload.llm_provider_id = null
    if (kind === 'image') payload.image_provider_id = null
    if (kind === 'video') payload.video_provider_id = null
    if (kind === 'tts') payload.tts_provider_id = null
    await updateSettingsM.mutateAsync(payload)
  }

  // Tabelas por competências
  const statusLabel = (st?: ProviderStatus['state']) => st === 'connected' ? 'Conectado' : st === 'unstable' ? 'Oscilando' : st === 'disconnected' ? 'Desconectado' : 'Indefinido'
  const statusDotClass = (st?: ProviderStatus['state']) => st === 'connected' ? 'bg-emerald-500' : st === 'unstable' ? 'bg-amber-400' : st === 'disconnected' ? 'bg-rose-500' : 'bg-zinc-500'
  const TableSection = ({ title, rows }: { title: string; rows: Provider[] }) => (
    <div className="mt-4 rounded-lg border border-white/10 bg-white/5">
      <div className="p-3 border-b border-white/10 font-medium">{title}</div>
      <div className="p-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-white/80">
              <th className="p-2">API Principal</th>
              <th className="p-2">Modelo</th>
              <th className="p-2">Status Conexão</th>
              <th className="p-2">Ajustes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="p-3 text-white/60" colSpan={4}>Nenhum provider configurado nesta tabela.</td></tr>
            )}
            {rows.map((p) => {
              const st = providersStatusQ.data?.find((s) => s.id === p.id)?.state
              const isDefault = (() => {
                const sid = settingsQ.data
                if (!sid) return false
                if (p.kind === 'llm') return sid.llm_provider_id === p.id
                if (p.kind === 'image') return sid.image_provider_id === p.id
                if (p.kind === 'video') return sid.video_provider_id === p.id
                if (p.kind === 'tts') return sid.tts_provider_id === p.id
                return false
              })()
              return (
                <tr key={p.id} className="border-t border-white/10">
                  <td className="p-2 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium">{p.meta?.group || p.name}</span>
                      {p.meta?.group && <span className="text-xs text-white/60">Provider: {p.name}</span>}
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="flex items-center gap-2">
                      <select
                        className="bg-zinc-800 text-white border border-white/20 rounded px-2 py-1 text-xs"
                        value={p.meta?.default_model || ''}
                        onChange={async (e) => {
                          const val = e.target.value
                          try {
                            const metaPatch = { ...(p.meta || {}), default_model: val }
                            await updateProviderM.mutateAsync({ id: p.id, data: { meta: metaPatch } })
                            toastSuccess('Modelo padrão atualizado')
                          } catch (err: any) {
                            toastError(err?.response?.data?.detail || 'Falha ao salvar modelo padrão')
                          }
                        }}
                      >
                        <option value="">Selecione</option>
                        {getModelOptions(p).map((m) => (<option key={m} value={m}>{m}</option>))}
                      </select>
                      {getModelOptions(p).length === 0 && (
                        <button className="px-2 py-1 rounded bg-teal-700 text-white text-xs" onClick={() => discoverModelsForProvider(p)}>Buscar modelos</button>
                      )}
                      <button
                        className="px-2 py-1 rounded bg-violet-700 text-white text-xs"
                        onClick={async () => {
                          try {
                            const metaPatch = {
                              ...(p.meta || {}),
                              template: 'piapi',
                              header_key: PIAPI_TEMPLATE.header_key,
                              endpoints: PIAPI_TEMPLATE.endpoints,
                              // PiAPI usa /api/v1/task tanto para criar quanto para consultar status
                              create_endpoint: '/api/v1/task',
                              get_task_endpoint: '/api/v1/task',
                              capabilities: Object.keys(PIAPI_TEMPLATE.models).filter((k) => {
                                const arr = (PIAPI_TEMPLATE.models as any)[k]
                                return Array.isArray(arr) && arr.length > 0
                              }),
                              models: PIAPI_TEMPLATE.models,
                            }
                            await updateProviderM.mutateAsync({ id: p.id, data: { meta: metaPatch } })
                            toastSuccess('Template PiAPI aplicado ao provider')
                            qc.invalidateQueries({ queryKey: ['providers', p.kind] })
                          } catch (err: any) {
                            toastError(err?.response?.data?.detail || 'Falha ao aplicar template')
                          }
                        }}
                      >Aplicar template</button>
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${statusDotClass(st)}`} />
                      <span className="text-xs text-white/70">{statusLabel(st)}</span>
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="flex items-center gap-2">
                      <a className="px-2 py-1 rounded bg-zinc-700 text-white text-xs" href={`/settings/providers/${p.id}`}>Editar</a>
                      <button className={`px-2 py-1 rounded text-xs ${isDefault ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-white'}`} onClick={() => setDefaultForKind(p.kind, p.id)}>Default</button>
                      <button className="px-2 py-1 rounded bg-red-600 text-white text-xs" onClick={() => deleteProviderM.mutate(p.id)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Provedores</h2>
      <p className="text-sm text-white/70">Gerencie APIs de IA e defina os padrões por categoria.</p>

      <div className="mt-3 flex items-center justify-between">
        {missing.length > 0 ? (
          <div className="text-xs text-amber-300">Falta IA para: {missing.join(', ')}. Os vídeos podem ficar mal feitos por falta de IA.</div>
        ) : (
          <div className="text-xs text-emerald-300">Mínimo necessário ativo. Sistema pronto para gerar vídeos.</div>
        )}
        <button className="px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-700" onClick={() => setProviderModalOpen(true)}>Adicionar API</button>
      </div>

      {/* Seções em tabelas por competências */}
      <div className="mt-6 space-y-6">
        {/* Multi-IA */}
        <div>
          <div className="text-sm font-semibold mb-2">APIs multi-IA</div>
          {(['llm','image','video','tts'] as const).map((kind) => {
            const list = (kind === 'llm' ? llmProvidersQ.data : kind === 'image' ? imageProvidersQ.data : kind === 'video' ? videoProvidersQ.data : ttsProvidersQ.data) || []
            const rows = list.filter((p) => Boolean(p.meta?.group))
            const title = kind === 'llm' ? 'Tabela (IA para Texto)' : kind === 'image' ? 'Tabela (IA para Imagem)' : kind === 'video' ? 'Tabela (IA para Vídeo)' : 'Tabela (IA para Som)'
            return <TableSection key={`multi-${kind}`} title={title} rows={rows} />
          })}
        </div>
        {/* Individuais */}
        <div>
          <div className="text-sm font-semibold mb-2">APIs individuais</div>
          {(['llm','image','video','tts'] as const).map((kind) => {
            const list = (kind === 'llm' ? llmProvidersQ.data : kind === 'image' ? imageProvidersQ.data : kind === 'video' ? videoProvidersQ.data : ttsProvidersQ.data) || []
            const rows = list.filter((p) => !p.meta?.group)
            const title = kind === 'llm' ? 'Tabela (IA para Texto)' : kind === 'image' ? 'Tabela (IA para Imagem)' : kind === 'video' ? 'Tabela (IA para Vídeo)' : 'Tabela (IA para Som)'
            return <TableSection key={`single-${kind}`} title={title} rows={rows} />
          })}
        </div>
      </div>

      {/* Provider Modal */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProviderModalOpen(false)} />
          <div className="relative w-[720px] max-w-[95vw] rounded-lg border border-white/10 bg-zinc-900/95 backdrop-blur-sm text-white shadow-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Adicionar API de IA</div>
              <button className="text-white/70 hover:text-white" onClick={() => setProviderModalOpen(false)}>✕</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="flex items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="providerMode" checked={providerMode === 'multi'} onChange={() => setProviderMode('multi')} />
                  API com várias IAs
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="providerMode" checked={providerMode === 'single'} onChange={() => setProviderMode('single')} />
                  API com IA única
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm">Nome da API</label>
                  <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={apiName} onChange={(e) => setApiName(e.target.value)} placeholder="Ex.: piapi-xyz" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm">Base URL</label>
                  <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="https://api.seu-provedor.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm">API Key</label>
                  <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="chave-secreta" />
                </div>
                <div className="md:col-span-3 flex items-end gap-2">
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-sm">Header Key (opcional)</label>
                    <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} placeholder="X-API-Key" />
                  </div>
                  <button className="px-3 py-2 rounded bg-teal-700 text-white text-sm h-[36px]" onClick={discoverGlobal}>Buscar modelos</button>
                  <button
                    className="px-3 py-2 rounded bg-violet-700 text-white text-sm h-[36px]"
                    onClick={() => applyTemplateToState(
                      PIAPI_TEMPLATE,
                      setHeaderKey,
                      setDiscoveredLLM,
                      setDiscoveredImage,
                      setDiscoveredVideo,
                      setDiscoveredTTS,
                      setModelsLLM,
                      setModelsImage,
                      setModelsVideo,
                      setModelsTTS,
                      setDefaultLLM,
                      setDefaultImage,
                      setDefaultVideo,
                      setDefaultTTS,
                    )}
                  >Carregar template PiAPI</button>
                </div>
              </div>

              {providerMode === 'multi' ? (
                <>
                  <div className="text-sm font-medium">Selecione categorias e modelos disponíveis</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded border border-white/10 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={useLLM} onChange={() => setUseLLM(!useLLM)} /> Usar para Texto (LLM)
                      </label>
                      {useLLM && (
                        <div className="mt-2 space-y-2">
                          <div className="text-xs text-white/70">Modelos disponíveis</div>
                          {discoveredLLM.length > 0 ? (
                            <div className="text-[11px] text-white/70">Descobertos: {discoveredLLM.join(', ')}</div>
                          ) : (
                            <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={modelsLLM} onChange={(e) => setModelsLLM(e.target.value)} placeholder="gpt-4o, claude-3.5, llama3" />
                          )}
                          <div className="text-xs text-white/70">Modelo padrão</div>
                          {discoveredLLM.length > 0 ? (
                            <select className="w-full bg-zinc-800 text-white border border-white/20 rounded px-2 py-1 text-sm" value={defaultLLM} onChange={(e) => setDefaultLLM(e.target.value)}>
                              {discoveredLLM.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          ) : (
                            <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={defaultLLM} onChange={(e) => setDefaultLLM(e.target.value)} placeholder="gpt-4o" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="rounded border border-white/10 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={useImage} onChange={() => setUseImage(!useImage)} /> Usar para Imagem
                      </label>
                      {useImage && (
                        <div className="mt-2 space-y-2">
                          <div className="text-xs text-white/70">Modelos disponíveis</div>
                          {discoveredImage.length > 0 ? (
                            <div className="text-[11px] text-white/70">Descobertos: {discoveredImage.join(', ')}</div>
                          ) : (
                            <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={modelsImage} onChange={(e) => setModelsImage(e.target.value)} placeholder="dalle, flux, stable-diffusion" />
                          )}
                          <div className="text-xs text-white/70">Modelo padrão</div>
                          {discoveredImage.length > 0 ? (
                            <select className="w-full bg-zinc-800 text-white border border-white/20 rounded px-2 py-1 text-sm" value={defaultImage} onChange={(e) => setDefaultImage(e.target.value)}>
                              {discoveredImage.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          ) : (
                            <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={defaultImage} onChange={(e) => setDefaultImage(e.target.value)} placeholder="dalle" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="rounded border border-white/10 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={useVideo} onChange={() => setUseVideo(!useVideo)} /> Usar para Vídeo
                      </label>
                      {useVideo && (
                        <div className="mt-2 space-y-2">
                          <div className="text-xs text-white/70">Modelos disponíveis</div>
                          {discoveredVideo.length > 0 ? (
                            <div className="text-[11px] text-white/70">Descobertos: {discoveredVideo.join(', ')}</div>
                          ) : (
                            <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={modelsVideo} onChange={(e) => setModelsVideo(e.target.value)} placeholder="custom, runway, veo" />
                          )}
                          <div className="text-xs text-white/70">Modelo padrão</div>
                          {discoveredVideo.length > 0 ? (
                            <select className="w-full bg-zinc-800 text-white border border-white/20 rounded px-2 py-1 text-sm" value={defaultVideo} onChange={(e) => setDefaultVideo(e.target.value)}>
                              {discoveredVideo.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          ) : (
                            <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={defaultVideo} onChange={(e) => setDefaultVideo(e.target.value)} placeholder="custom" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="rounded border border-white/10 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={useTTS} onChange={() => setUseTTS(!useTTS)} /> Usar para TTS
                      </label>
                      {useTTS && (
                        <div className="mt-2 space-y-2">
                          <div className="text-xs text-white/70">Modelos disponíveis</div>
                          {discoveredTTS.length > 0 ? (
                            <div className="text-[11px] text-white/70">Descobertos: {discoveredTTS.join(', ')}</div>
                          ) : (
                            <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={modelsTTS} onChange={(e) => setModelsTTS(e.target.value)} placeholder="elevenlabs, azure-tts" />
                          )}
                          <div className="text-xs text-white/70">Modelo padrão</div>
                          {discoveredTTS.length > 0 ? (
                            <select className="w-full bg-zinc-800 text-white border border-white/20 rounded px-2 py-1 text-sm" value={defaultTTS} onChange={(e) => setDefaultTTS(e.target.value)}>
                              {discoveredTTS.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          ) : (
                            <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={defaultTTS} onChange={(e) => setDefaultTTS(e.target.value)} placeholder="elevenlabs" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-white/60">Dica: você pode adicionar somente algumas categorias e completar outras depois.</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">Ative APIs por categoria (IA única por situação)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Texto (LLM) */}
                    <div className="rounded border border-white/10 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={singleLLMEnabled} onChange={() => setSingleLLMEnabled(!singleLLMEnabled)} /> Texto (LLM)
                      </label>
                      {singleLLMEnabled && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Nome" value={singleLLMName} onChange={(e) => setSingleLLMName(e.target.value)} />
                          {singleLLMModels.length > 0 ? (
                            <select className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={singleLLMDefault} onChange={(e) => setSingleLLMDefault(e.target.value)}>
                              {singleLLMModels.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          ) : (
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Modelo padrão (ex.: gpt-4o)" value={singleLLMDefault} onChange={(e) => setSingleLLMDefault(e.target.value)} />
                          )}
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Base URL" value={singleLLMBase} onChange={(e) => setSingleLLMBase(e.target.value)} />
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="API Key" value={singleLLMKey} onChange={(e) => setSingleLLMKey(e.target.value)} />
                          <button className="px-2 py-1 rounded bg-teal-700 text-white text-xs" onClick={() => discoverForSingle('llm', singleLLMBase, singleLLMKey)}>Buscar</button>
                        </div>
                      )}
                    </div>
                    {/* Imagem */}
                    <div className="rounded border border-white/10 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={singleImageEnabled} onChange={() => setSingleImageEnabled(!singleImageEnabled)} /> Imagem
                      </label>
                      {singleImageEnabled && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Nome" value={singleImageName} onChange={(e) => setSingleImageName(e.target.value)} />
                          {singleImageModels.length > 0 ? (
                            <select className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={singleImageDefault} onChange={(e) => setSingleImageDefault(e.target.value)}>
                              {singleImageModels.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          ) : (
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Modelo padrão (ex.: dalle)" value={singleImageDefault} onChange={(e) => setSingleImageDefault(e.target.value)} />
                          )}
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Base URL" value={singleImageBase} onChange={(e) => setSingleImageBase(e.target.value)} />
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="API Key" value={singleImageKey} onChange={(e) => setSingleImageKey(e.target.value)} />
                          <button className="px-2 py-1 rounded bg-teal-700 text-white text-xs" onClick={() => discoverForSingle('image', singleImageBase, singleImageKey)}>Buscar</button>
                        </div>
                      )}
                    </div>
                    {/* Vídeo */}
                    <div className="rounded border border-white/10 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={singleVideoEnabled} onChange={() => setSingleVideoEnabled(!singleVideoEnabled)} /> Vídeo
                      </label>
                      {singleVideoEnabled && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Nome" value={singleVideoName} onChange={(e) => setSingleVideoName(e.target.value)} />
                          {singleVideoModels.length > 0 ? (
                            <select className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={singleVideoDefault} onChange={(e) => setSingleVideoDefault(e.target.value)}>
                              {singleVideoModels.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          ) : (
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Modelo padrão (ex.: custom)" value={singleVideoDefault} onChange={(e) => setSingleVideoDefault(e.target.value)} />
                          )}
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Base URL" value={singleVideoBase} onChange={(e) => setSingleVideoBase(e.target.value)} />
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="API Key" value={singleVideoKey} onChange={(e) => setSingleVideoKey(e.target.value)} />
                          <button className="px-2 py-1 rounded bg-teal-700 text-white text-xs" onClick={() => discoverForSingle('video', singleVideoBase, singleVideoKey)}>Buscar</button>
                        </div>
                      )}
                    </div>
                    {/* TTS */}
                    <div className="rounded border border-white/10 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={singleTTSEnabled} onChange={() => setSingleTTSEnabled(!singleTTSEnabled)} /> Som (TTS)
                      </label>
                      {singleTTSEnabled && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Nome" value={singleTTSName} onChange={(e) => setSingleTTSName(e.target.value)} />
                          {singleTTSModels.length > 0 ? (
                            <select className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={singleTTSDefault} onChange={(e) => setSingleTTSDefault(e.target.value)}>
                              {singleTTSModels.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          ) : (
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Modelo padrão (ex.: elevenlabs)" value={singleTTSDefault} onChange={(e) => setSingleTTSDefault(e.target.value)} />
                          )}
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="Base URL" value={singleTTSBase} onChange={(e) => setSingleTTSBase(e.target.value)} />
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" placeholder="API Key" value={singleTTSKey} onChange={(e) => setSingleTTSKey(e.target.value)} />
                          <button className="px-2 py-1 rounded bg-teal-700 text-white text-xs" onClick={() => discoverForSingle('tts', singleTTSBase, singleTTSKey)}>Buscar</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-amber-300">Para funcionamento completo, ative Texto (LLM), Imagem, Vídeo e Som (TTS). Se faltar uma, os vídeos podem ficar mal feitos.</div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 mt-4">
                <button className="px-3 py-1 rounded border border-white/20 text-white" onClick={() => setProviderModalOpen(false)}>Cancelar</button>
                {providerMode === 'multi' ? (
                  <button className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700" onClick={createMultiProviders} disabled={!apiName}>Salvar API multi-IA</button>
                ) : (
                  <button className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700" onClick={createSingleProvidersBatch}>Salvar APIs por categoria</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}