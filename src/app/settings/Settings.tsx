import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { GoogleConnect } from '@/features/auth/GoogleConnect'
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { toastError, toastSuccess } from '@/lib/toast'

type Channel = {
  id: number
  name: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  external_id: string
  enabled: boolean
}

type TargetStatus = {
  channel_id: number
  name: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  connected: boolean
}

type Provider = {
  id: number
  name: string
  kind: 'llm' | 'image' | 'video' | 'tts' | 'stt'
  enabled: boolean
}

type SettingsResp = {
  id: number
  auto_publish: boolean
  publish_targets: Record<string, boolean>
  llm_provider_id?: number | null
  image_provider_id?: number | null
  video_provider_id?: number | null
  tts_provider_id?: number | null
  meta: Record<string, any>
}

type IntegrationStatus = {
  ready: boolean
  missing: string[]
  required: string[]
  note?: string
}
type IntegrationsResp = {
  youtube: IntegrationStatus
  instagram: IntegrationStatus
  tiktok: IntegrationStatus
}

type LinkedChannel = { external_id: string; name: string }

function YouTubeGoogleLoginButton({ clientId, channelId, onChannelsFetched }: { clientId: string; channelId?: number | null; onChannelsFetched?: (list: LinkedChannel[]) => void }) {
  const qc = useQueryClient()
  function InnerButton() {
    const login = useGoogleLogin({
      flow: 'auth-code',
      // F01 (somente leitura): pedir apenas escopos necessários
      scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly',
      onSuccess: async (codeResponse) => {
        try {
          await api.post('/oauth/youtube/exchange', { code: (codeResponse as any).code }, { params: { channel_id: channelId ?? undefined } })
          toastSuccess('Conta Google conectada para YouTube')
          qc.invalidateQueries({ queryKey: ['targets'] })
          qc.invalidateQueries({ queryKey: ['channels'] })
          // Após conectar, buscar automaticamente canais vinculados desta conta
          if (channelId) {
            try {
              const { data } = await api.get('/oauth/youtube/account/channels', { params: { channel_id: channelId } })
              const list: LinkedChannel[] = Array.isArray(data) ? data : []
              if (onChannelsFetched) onChannelsFetched(list)
              if (list.length > 0) {
                toastSuccess(`Canais do YouTube carregados: ${list.map((c) => c.name).join(', ')}`)
              }
            } catch (e: any) {
              toastError(e?.response?.data?.detail || 'Falha ao listar canais vinculados')
            }
          }
        } catch (e: any) {
          toastError(e?.response?.data?.detail || 'Falha ao conectar com Google')
        }
      },
      onError: () => toastError('Login Google falhou'),
    })
    return (
      <button className="px-3 py-1 rounded border border-white/20 text-white text-xs" onClick={() => login()}>
        Login com Google
      </button>
    )
  }
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <InnerButton />
    </GoogleOAuthProvider>
  )
}

export default function Settings() {
  const qc = useQueryClient()
  const [isConnectOpen, setConnectOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'x' | ''>('')
  const [loginMethod, setLoginMethod] = useState<'oauth' | 'manual'>('oauth')
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null)
  const [linkedChannels, setLinkedChannels] = useState<{ external_id: string; name: string }[]>([])
  const [selectedLinkedExternalId, setSelectedLinkedExternalId] = useState<string>('')
  const [isAccountDetailsOpen, setAccountDetailsOpen] = useState(false)
  const [accountDetailsGroup, setAccountDetailsGroup] = useState<AccountGroup | null>(null)
  const [autoDefaultDone, setAutoDefaultDone] = useState(false)
  const [pendingDefaultChannelId, setPendingDefaultChannelId] = useState<number | null>(null)
  // Fallback: acompanhar conexão após abrir popup OAuth
  const [pendingConnectChannelId, setPendingConnectChannelId] = useState<number | null>(null)
  const [isConnectPolling, setIsConnectPolling] = useState(false)
  const [pendingConnectPlatform, setPendingConnectPlatform] = useState<Channel['platform'] | null>(null)

  const channelsQ = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const { data } = await api.get('/channels')
      return data
    },
  })

  const targetsQ = useQuery<TargetStatus[]>({
    queryKey: ['targets'],
    queryFn: async () => {
      const { data } = await api.get('/publications/targets')
      return data
    },
  })

  // Providers and Settings for AI defaults
  const settingsQ = useQuery<SettingsResp>({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
    staleTime: 60_000,
  })

  const llmProvidersQ = useQuery<Provider[]>({
    queryKey: ['providers', 'llm'],
    queryFn: async () => (await api.get('/providers', { params: { kind: 'llm' } })).data,
    staleTime: 60_000,
  })
  const imageProvidersQ = useQuery<Provider[]>({
    queryKey: ['providers', 'image'],
    queryFn: async () => (await api.get('/providers', { params: { kind: 'image' } })).data,
    staleTime: 60_000,
  })
  const videoProvidersQ = useQuery<Provider[]>({
    queryKey: ['providers', 'video'],
    queryFn: async () => (await api.get('/providers', { params: { kind: 'video' } })).data,
    staleTime: 60_000,
  })
  const ttsProvidersQ = useQuery<Provider[]>({
    queryKey: ['providers', 'tts'],
    queryFn: async () => (await api.get('/providers', { params: { kind: 'tts' } })).data,
    staleTime: 60_000,
  })

  const updateSettingsM = useMutation({
    mutationFn: async (body: Partial<SettingsResp>) => (await api.put('/settings', body)).data,
    onSuccess: () => {
      toastSuccess('Configurações atualizadas')
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao atualizar configurações'),
  })

  // Providers creation
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

  // Status das integrações (chaves de API / variáveis de ambiente)
  const integrationsQ = useQuery<IntegrationsResp>({
    queryKey: ['integrations_status'],
    queryFn: async () => (await api.get('/integrations/status')).data,
    staleTime: 30_000,
  })
  const integrationsCfgQ = useQuery<Record<string, string>>({
    queryKey: ['integrations_config'],
    queryFn: async () => (await api.get('/integrations/config')).data,
    staleTime: 60_000,
  })
  // Modal de importação de JSON Google
  const [isImportModalOpen, setImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const openImportModal = () => setImportModalOpen(true)
  const confirmImportGoogleJSON = async () => {
    if (!importFile) {
      toastError('Selecione o arquivo JSON do Google')
      return
    }
    try {
      const form = new FormData()
      form.append('file', importFile)
      await api.post('/integrations/import/google', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toastSuccess('Credenciais Google importadas')
      qc.invalidateQueries({ queryKey: ['integrations_config'] })
      qc.invalidateQueries({ queryKey: ['integrations_status'] })
      setImportModalOpen(false)
      setImportFile(null)
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao importar credenciais Google')
    }
  }

  // Modal de configuração de chaves por plataforma
  const [isKeysModalOpen, setKeysModalOpen] = useState(false)
  const [keysPlatform, setKeysPlatform] = useState<'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'x' | ''>('')
  const [keyValues, setKeyValues] = useState<Record<string, string>>({})
  const openKeysModal = (plat: 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'x') => {
    setKeysPlatform(plat)
    api.get('/integrations/config')
      .then(({ data }) => {
        const meta = (data || {}) as Record<string, string>
        const preset: Record<string, string> = {}
        const map: Record<string, string[]> = {
          youtube: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'YT_REDIRECT_URI', 'GOOGLE_API_KEY'],
          instagram: ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI'],
          tiktok: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REDIRECT_URI'],
          facebook: ['FB_APP_ID', 'FB_APP_SECRET', 'FB_REDIRECT_URI'],
          x: ['X_CLIENT_ID', 'X_CLIENT_SECRET', 'X_REDIRECT_URI'],
        }
        for (const k of map[plat]) preset[k] = meta[k] || ''
        setKeyValues(preset)
        setKeysModalOpen(true)
      })
      .catch(() => {
        setKeyValues({})
        setKeysModalOpen(true)
      })
  }
  const updateKey = (k: string, v: string) => setKeyValues((prev) => ({ ...prev, [k]: v }))
  const saveKeys = async () => {
    // Primeiro, salvar sempre; depois tentar validar sem bloquear o salvamento
    try {
      const { data } = await api.post('/integrations/config', keyValues)
      qc.invalidateQueries({ queryKey: ['integrations_config'] })
      qc.invalidateQueries({ queryKey: ['integrations_status'] })
      const savedCount = Number(data?.count ?? 0)
      toastSuccess(savedCount > 0 ? 'Chaves salvas' : 'Nenhuma alteração nas chaves')
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao salvar chaves')
      return
    }

    // Validação é melhor esforço: informa resultado sem impedir o fluxo
    try {
      await api.get(`/integrations/validate/${keysPlatform}`)
      toastSuccess('Chaves validadas com sucesso')
      setKeysModalOpen(false)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Validação falhou. Verifique chaves obrigatórias.'
      toastError(msg)
      // Mantém a modal aberta para o usuário corrigir os campos faltantes
    }
  }

  // Toggles de publicação global (auto_publish e publish_targets)
  const publishTargets = useMemo<Record<'youtube' | 'instagram' | 'tiktok', boolean>>(() => {
    const defaults = { youtube: true, instagram: false, tiktok: false }
    const s = settingsQ.data
    const incoming = (s?.publish_targets ?? {}) as Record<string, boolean>
    return {
      youtube: incoming.youtube ?? defaults.youtube,
      instagram: incoming.instagram ?? defaults.instagram,
      tiktok: incoming.tiktok ?? defaults.tiktok,
    }
  }, [settingsQ.data])

  const toggleAutoPublish = () => {
    const next = !Boolean(settingsQ.data?.auto_publish)
    updateSettingsM.mutate({ auto_publish: next })
  }

  const toggleTarget = (key: 'youtube' | 'instagram' | 'tiktok') => {
    const nextTargets = { ...publishTargets, [key]: !publishTargets[key] }
    updateSettingsM.mutate({ publish_targets: nextTargets })
  }

  // Modal para adicionar API de IA
  const [isProviderModalOpen, setProviderModalOpen] = useState(false)
  const [providerMode, setProviderMode] = useState<'multi' | 'single'>('multi')
  const [apiName, setApiName] = useState('')
  const [apiBase, setApiBase] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [headerKey, setHeaderKey] = useState('')
  const [useLLM, setUseLLM] = useState(true)
  const [useImage, setUseImage] = useState(false)
  const [useVideo, setUseVideo] = useState(false)
  const [useTTS, setUseTTS] = useState(false)
  // Descoberta: listas de modelos por categoria
  const [discoveredLLM, setDiscoveredLLM] = useState<string[]>([])
  const [discoveredImage, setDiscoveredImage] = useState<string[]>([])
  const [discoveredVideo, setDiscoveredVideo] = useState<string[]>([])
  const [discoveredTTS, setDiscoveredTTS] = useState<string[]>([])
  // Compat: manter estados de string para fallback
  const [modelsLLM, setModelsLLM] = useState('')
  const [modelsImage, setModelsImage] = useState('')
  const [modelsVideo, setModelsVideo] = useState('')
  const [modelsTTS, setModelsTTS] = useState('')
  const [defaultLLM, setDefaultLLM] = useState('')
  const [defaultImage, setDefaultImage] = useState('')
  const [defaultVideo, setDefaultVideo] = useState('')
  const [defaultTTS, setDefaultTTS] = useState('')
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

  const noDefaultsConfigured = !settingsQ.data?.llm_provider_id && !settingsQ.data?.image_provider_id && !settingsQ.data?.video_provider_id && !settingsQ.data?.tts_provider_id

  const parseModels = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
  const createMultiProviders = async () => {
    const metaCommon = { group: apiName }
    const creations: Array<Promise<any>> = []
    const defaultsToSet: Partial<SettingsResp> = {}
    if (useLLM) {
      const models = discoveredLLM.length ? discoveredLLM : parseModels(modelsLLM)
      const res = await createProviderM.mutateAsync({ name: `${apiName} (LLM)`, kind: 'llm', api_base: apiBase, api_key: apiKey, meta: { ...metaCommon, models, default_model: defaultLLM }, enabled: true })
      defaultsToSet.llm_provider_id = res.id
    }
    if (useImage) {
      const models = discoveredImage.length ? discoveredImage : parseModels(modelsImage)
      const res = await createProviderM.mutateAsync({ name: `${apiName} (Imagem)`, kind: 'image', api_base: apiBase, api_key: apiKey, meta: { ...metaCommon, models, default_model: defaultImage }, enabled: true })
      defaultsToSet.image_provider_id = res.id
    }
    if (useVideo) {
      const models = discoveredVideo.length ? discoveredVideo : parseModels(modelsVideo)
      const res = await createProviderM.mutateAsync({ name: `${apiName} (Vídeo)`, kind: 'video', api_base: apiBase, api_key: apiKey, meta: { ...metaCommon, models, default_model: defaultVideo }, enabled: true })
      defaultsToSet.video_provider_id = res.id
    }
    if (useTTS) {
      const models = discoveredTTS.length ? discoveredTTS : parseModels(modelsTTS)
      const res = await createProviderM.mutateAsync({ name: `${apiName} (TTS)`, kind: 'tts', api_base: apiBase, api_key: apiKey, meta: { ...metaCommon, models, default_model: defaultTTS }, enabled: true })
      defaultsToSet.tts_provider_id = res.id
    }
    if (Object.keys(defaultsToSet).length > 0) {
      await updateSettingsM.mutateAsync(defaultsToSet)
      toastSuccess('Defaults atualizados para a API adicionada')
    }
    setProviderModalOpen(false)
    setApiName(''); setApiBase(''); setApiKey('')
    setHeaderKey('')
    setDiscoveredLLM([]); setDiscoveredImage([]); setDiscoveredVideo([]); setDiscoveredTTS([])
    setDefaultLLM(''); setDefaultImage(''); setDefaultVideo(''); setDefaultTTS('')
  }

  const createSingleProvidersBatch = async () => {
    const updates: Partial<SettingsResp> = {}
    if (singleLLMEnabled) {
      const res = await createProviderM.mutateAsync({ name: singleLLMName || 'LLM', kind: 'llm', api_base: singleLLMBase, api_key: singleLLMKey, meta: { single_api: true, default_model: singleLLMDefault }, enabled: true })
      updates.llm_provider_id = res.id
    }
    if (singleImageEnabled) {
      const res = await createProviderM.mutateAsync({ name: singleImageName || 'Imagem', kind: 'image', api_base: singleImageBase, api_key: singleImageKey, meta: { single_api: true, default_model: singleImageDefault }, enabled: true })
      updates.image_provider_id = res.id
    }
    if (singleVideoEnabled) {
      const res = await createProviderM.mutateAsync({ name: singleVideoName || 'Vídeo', kind: 'video', api_base: singleVideoBase, api_key: singleVideoKey, meta: { single_api: true, default_model: singleVideoDefault }, enabled: true })
      updates.video_provider_id = res.id
    }
    if (singleTTSEnabled) {
      const res = await createProviderM.mutateAsync({ name: singleTTSName || 'TTS', kind: 'tts', api_base: singleTTSBase, api_key: singleTTSKey, meta: { single_api: true, default_model: singleTTSDefault }, enabled: true })
      updates.tts_provider_id = res.id
    }
    if (Object.keys(updates).length > 0) {
      await updateSettingsM.mutateAsync(updates)
      toastSuccess('APIs únicas adicionadas e definidas como padrão por categoria')
    }
    setProviderModalOpen(false)
  }

  // Descoberta por categoria (modo single)
  const discoverForSingle = async (kind: Provider['kind'], base: string, key: string) => {
    try {
      const res = await api.post('/piapi/discover', { api_base: base, api_key: key, header_key: headerKey })
      const kinds = res.data?.kinds || {}
      if (kind === 'llm') {
        const list = kinds.llm || []
        setSingleLLMModels(list)
        if (list.length > 0) setSingleLLMDefault(list[0])
      }
      if (kind === 'image') {
        const list = kinds.image || []
        setSingleImageModels(list)
        if (list.length > 0) setSingleImageDefault(list[0])
      }
      if (kind === 'video') {
        const list = kinds.video || []
        setSingleVideoModels(list)
        if (list.length > 0) setSingleVideoDefault(list[0])
      }
      if (kind === 'tts') {
        const list = kinds.tts || []
        setSingleTTSModels(list)
        if (list.length > 0) setSingleTTSDefault(list[0])
      }
      toastSuccess('Modelos descobertos para ' + (kind === 'llm' ? 'LLM' : kind === 'image' ? 'Imagem' : kind === 'video' ? 'Vídeo' : 'TTS'))
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao descobrir modelos')
    }
  }

  const disconnectM = useMutation({
    mutationFn: async (channelId: number) => {
      const { data } = await api.delete(`/channels/${channelId}/credentials`)
      return data
    },
    onSuccess: () => {
      toastSuccess('Conexão removida com sucesso')
      qc.invalidateQueries({ queryKey: ['targets'] })
    },
    onError: (err: any) => {
      toastError(`Falha ao desconectar: ${err?.message || 'erro'}`)
    },
  })

  const channels = Array.isArray(channelsQ.data) ? channelsQ.data : []
  const youtubeChannels = channels.filter((c) => c.platform === 'youtube')
  const instagramChannels = channels.filter((c) => c.platform === 'instagram')
  const tiktokChannels = channels.filter((c) => c.platform === 'tiktok')
  const targetsMap = new Map<number, boolean>()
  const targetsList = Array.isArray(targetsQ.data) ? targetsQ.data : []
  targetsList.forEach((t) => targetsMap.set(t.channel_id, t.connected))
  const connectedCount = useMemo(() => targetsList.filter((t) => t.connected).length, [targetsList])

  // ===== Contas vinculadas (agrupadas por plataforma + email) =====
  type AccountGroup = {
    key: string
    platform: Channel['platform']
    email: string
    name?: string
    avatar?: string
    channels: Channel[]
  }

  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const list = channelsQ.data || []
        const creds = await Promise.all(
          list.map(async (ch) => {
            try {
              const { data } = await api.get(`/channels/${ch.id}/credentials`)
              return { channel: ch, cred: data }
            } catch {
              return null
            }
          })
        )
        const map = new Map<string, AccountGroup>()
        for (const item of creds) {
          if (!item) continue
          const { channel, cred } = item
          const meta = cred?.meta || {}
          const email: string | undefined = meta.account_email || meta.email
          if (!email) continue
          const key = `${channel.platform}:${email}`
          if (!map.has(key)) {
            map.set(key, {
              key,
              platform: channel.platform,
              email,
              name: meta.account_name || meta.name || meta.display_name,
              avatar: meta.account_avatar || meta.avatar_url || meta.picture,
              channels: [],
            })
          }
          map.get(key)!.channels.push(channel)
        }
        setAccountGroups(Array.from(map.values()))
      } catch {}
    }
    load()
  }, [channelsQ.data])

  // Auto-definir conta padrão na primeira conexão, se nenhuma estiver definida
  useEffect(() => {
    const currentDefault = settingsQ.data?.meta?.default_account
    if (!currentDefault && accountGroups.length > 0 && !autoDefaultDone) {
      const grp = accountGroups[0]
      setDefaultAccountM.mutate({
        platform: grp.platform,
        email: grp.email,
        name: grp.name,
        avatar: grp.avatar,
        channel_id: grp.channels[0]?.id,
      })
      setAutoDefaultDone(true)
    }
  }, [settingsQ.data?.meta, accountGroups, autoDefaultDone])

  // Após nova conexão, definir automaticamente a conta recém conectada como padrão
  useEffect(() => {
    if (!pendingDefaultChannelId) return
    const grp = accountGroups.find((g) => g.channels.some((c) => c.id === pendingDefaultChannelId))
    if (grp) {
      setDefaultAccountM.mutate({
        platform: grp.platform,
        email: grp.email,
        name: grp.name,
        avatar: grp.avatar,
        channel_id: pendingDefaultChannelId,
      })
      setPendingDefaultChannelId(null)
    }
  }, [accountGroups, pendingDefaultChannelId])

  const toggleChannelEnabledM = useMutation({
    mutationFn: async (payload: { channel_id: number; enabled: boolean }) => {
      return (await api.put(`/channels/${payload.channel_id}/enabled`, { enabled: payload.enabled })).data
    },
    onSuccess: () => {
      toastSuccess('Canal atualizado')
      qc.invalidateQueries({ queryKey: ['channels'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao atualizar canal'),
  })

  const bindExternalChannelM = useMutation({
    mutationFn: async (payload: { channel_id: number; external_id: string }) => {
      return (await api.put(`/channels/${payload.channel_id}/external-id`, { external_id: payload.external_id })).data
    },
    onSuccess: () => {
      toastSuccess('Canal vinculado')
      qc.invalidateQueries({ queryKey: ['channels'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao vincular canal'),
  })

  const setDefaultAccountM = useMutation({
    mutationFn: async (payload: { platform: string; email: string; name?: string; avatar?: string; channel_id?: number }) => {
      const current = settingsQ.data?.meta || {}
      return (await api.put('/settings', { meta: { ...current, default_account: payload } })).data
    },
    onSuccess: () => {
      toastSuccess('Conta definida como padrão')
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao definir padrão'),
  })

  const logoutAccountM = useMutation({
    mutationFn: async (payload: { platform: string; email: string; archive?: boolean }) => {
      return (await api.delete(`/oauth/${payload.platform}/logout`, { params: { email: payload.email, archive: payload.archive } })).data
    },
    onSuccess: () => {
      toastSuccess('Conta deslogada com sucesso')
      qc.invalidateQueries({ queryKey: ['channels'] })
      qc.invalidateQueries({ queryKey: ['targets'] })
      qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao deslogar conta'),
  })

  // Listener para quando o popup OAuth sinalizar conclusão
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e?.data
      if (data && typeof data === 'object' && (data as any).type === 'oauth_done') {
        toastSuccess('Conexão concluída. Atualizando dados…')
        qc.invalidateQueries({ queryKey: ['targets'] })
        qc.invalidateQueries({ queryKey: ['channels'] })
        qc.invalidateQueries({ queryKey: ['settings'] })
        setConnectOpen(false)
        setIsConnectPolling(false)
        setPendingConnectChannelId(null)
        // Após OAuth, tentar auto-vincular canal para YouTube se possível
        if (pendingConnectPlatform === 'youtube' && pendingConnectChannelId) {
          autoBindYouTubeAfterOAuth(pendingConnectChannelId)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [qc])

  // Suporte ao fluxo com redirect direto para /settings (Authorized Redirect URI do Google)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    // Apenas processar se estivermos na rota /settings e houver 'code'
    if (code && window.location.pathname.includes('/settings')) {
      (async () => {
        try {
          await api.post('/oauth/youtube/exchange', {
            code,
            redirect_uri: `${window.location.origin}/settings`,
          })
          toastSuccess('Conta Google conectada para YouTube')
          qc.invalidateQueries({ queryKey: ['targets'] })
          qc.invalidateQueries({ queryKey: ['channels'] })
        } catch (e: any) {
          toastError(e?.response?.data?.detail || 'Falha ao conectar com Google')
        } finally {
          // Limpar parâmetros da URL para evitar reprocessar ao atualizar
          const cleanUrl = `${window.location.origin}${window.location.pathname}`
          window.history.replaceState({}, '', cleanUrl)
          // Se esta aba/janela foi aberta por window.open, podemos fechá-la
          try {
            if (window.opener) window.close()
          } catch {}
        }
      })()
    } else if (error) {
      // Limpar parâmetros também em caso de erro
      const cleanUrl = `${window.location.origin}${window.location.pathname}`
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [qc])

  const oauthAuthorize = async (platform: string, channelId: number | null) => {
    if (!platform) {
      toastError('Selecione uma plataforma')
      return
    }
    // Verificar se a integração está pronta antes de abrir a janela
    try {
      const status = integrationsQ.data || (await api.get('/integrations/status')).data
      const key = platform as keyof IntegrationsResp
      const platStatus = status[key]
      if (!platStatus?.ready) {
        const missing = platStatus?.missing?.length ? `Faltando: ${platStatus.missing.join(', ')}` : ''
        toastError(`Configure primeiro antes de usar este serviço. ${missing}`)
        const el = document.getElementById('integrations-config')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    } catch (e: any) {
      toastError('Verifique a configuração de chaves de API antes de continuar.')
      const el = document.getElementById('integrations-config')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
    const params = channelId ? `?channel_id=${channelId}` : ''
    const url = `${base}/oauth/${platform}/authorize${params}`
    window.open(url, '_blank')
    toastSuccess('Janela de conexão aberta. Conclua o consentimento e volte aqui.')
    // Iniciar fallback de polling para detectar conclusão
    if (channelId) {
      setPendingConnectChannelId(channelId)
      setIsConnectPolling(true)
      setPendingConnectPlatform(platform as Channel['platform'])
    }
  }

  const fetchLinkedChannels = async () => {
    if (!selectedPlatform || !selectedChannelId) {
      toastError('Selecione plataforma e canal')
      return
    }
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
    try {
      const { data } = await api.get(`/oauth/${selectedPlatform}/account/channels`, { params: { channel_id: selectedChannelId } })
      const list = Array.isArray(data) ? data : []
      setLinkedChannels(list)
      if (list.length > 0) setSelectedLinkedExternalId(list[0].external_id)
      toastSuccess(`Encontrados ${list.length} canal(is) vinculados`)
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao listar canais da conta')
    }
  }

  const bindSelectedLinkedChannel = async () => {
    if (!selectedChannelId || !selectedLinkedExternalId) {
      toastError('Selecione um canal vinculado')
      return
    }
    try {
      const chosen = linkedChannels.find((c) => c.external_id === selectedLinkedExternalId)
      await api.put(`/channels/${selectedChannelId}/external-id`, {
        external_id: selectedLinkedExternalId,
        name: chosen?.name,
      })
      toastSuccess('Canal atualizado com o vínculo selecionado')
      qc.invalidateQueries({ queryKey: ['channels'] })
      setConnectOpen(false)
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao atualizar canal')
    }
  }

  // Após OAuth no YouTube, buscar canais vinculados e vincular automaticamente se houver 1
  const autoBindYouTubeAfterOAuth = async (channelId: number) => {
    try {
      const { data } = await api.get(`/oauth/youtube/account/channels`, { params: { channel_id: channelId } })
      const list: { external_id: string; name: string }[] = Array.isArray(data) ? data : []
      if (list.length === 1) {
        const only = list[0]
        await api.put(`/channels/${channelId}/external-id`, { external_id: only.external_id, name: only.name })
        toastSuccess(`Canal vinculado: ${only.name}`)
        qc.invalidateQueries({ queryKey: ['channels'] })
      } else if (list.length > 1) {
        toastSuccess('Vários canais encontrados na conta. Selecione um na modal.')
        // Abrir modal de conexão com lista carregada
        setSelectedPlatform('youtube')
        setSelectedChannelId(channelId)
        setConnectOpen(true)
        setLinkedChannels(list)
        setSelectedLinkedExternalId(list[0].external_id)
      } else {
        toastError('Nenhum canal do YouTube retornado para a conta. Verifique permissões.')
      }
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao buscar canais vinculados do YouTube')
    }
  }

  // Polling de conexão: verifica alvo/canais a cada 2s por até 60s
  useEffect(() => {
    if (!isConnectPolling || !pendingConnectChannelId) return
    let active = true
    let attempts = 0
    const tick = async () => {
      if (!active) return
      attempts += 1
      try {
        const { data } = await api.get('/publications/targets')
        const list: TargetStatus[] = Array.isArray(data) ? data : []
        const found = list.find((t) => t.channel_id === pendingConnectChannelId && t.connected)
        if (found) {
          toastSuccess('Conexão detectada. Atualizando…')
          qc.invalidateQueries({ queryKey: ['targets'] })
          qc.invalidateQueries({ queryKey: ['channels'] })
          qc.invalidateQueries({ queryKey: ['settings'] })
          setIsConnectPolling(false)
          setConnectOpen(false)
          // Após detectar conexão, auto-vincular YouTube se necessário
          if (pendingConnectPlatform === 'youtube' && pendingConnectChannelId) {
            autoBindYouTubeAfterOAuth(pendingConnectChannelId)
          }
          return
        }
      } catch {}
      if (attempts < 30) {
        setTimeout(tick, 2000)
      } else {
        // Tempo esgotado
        setIsConnectPolling(false)
        toastError('Não foi possível confirmar a conexão automaticamente. Atualize a página.')
      }
    }
    tick()
    return () => {
      active = false
    }
  }, [isConnectPolling, pendingConnectChannelId, qc])

  // Linha da tabela para YouTube com informação da conta e seleção de canais vinculados
  const YTChannelRow: React.FC<{ c: { id: number; name: string }; connected: boolean }> = ({ c, connected }) => {
    // Credenciais (para obter meta: display_name, avatar_url, external_id, account_email)
    const credsQ = useQuery({
      queryKey: ['channel-credentials', c.id],
      queryFn: async () => {
        const { data } = await api.get(`/channels/${c.id}/credentials`)
        return data as { connected: boolean; meta?: any }
      },
      enabled: true,
    })
    // Listar canais vinculáveis da conta autenticada
    const linkedQ = useQuery({
      queryKey: ['linked-channels', 'youtube', c.id],
      queryFn: async () => {
        const { data } = await api.get(`/oauth/youtube/account/channels`, { params: { channel_id: c.id } })
        return Array.isArray(data) ? data as { external_id: string; name: string }[] : []
      },
      enabled: connected,
    })

    const [rowSelectedExternalId, setRowSelectedExternalId] = useState<string>('')
    useEffect(() => {
      const first = linkedQ.data?.[0]?.external_id
      if (first) setRowSelectedExternalId(first)
    }, [linkedQ.data])

    const bindM = useMutation({
      mutationFn: async (payload: { external_id: string; name?: string }) => {
        return api.put(`/channels/${c.id}/external-id`, payload)
      },
      onSuccess: () => {
        toastSuccess('Canal atualizado com o vínculo selecionado')
        qc.invalidateQueries({ queryKey: ['channels'] })
      },
      onError: (e: any) => {
        toastError(e?.response?.data?.detail || 'Falha ao atualizar canal')
      },
    })

    const accountEmail = credsQ.data?.meta?.account_email
    const displayName = credsQ.data?.meta?.display_name

    return (
      <tr className="border-t border-white/10" key={c.id}>
        <td className="py-2 pr-4">
          <div className="flex flex-col">
            <span>{c.name}</span>
            {connected && (
              <span className="text-xs text-white/60 mt-1">
                {displayName ? `Canal: ${displayName}` : 'Canal não identificado'}{accountEmail ? ` · Conta Google: ${accountEmail}` : ''}
              </span>
            )}
          </div>
        </td>
        <td className="py-2 pr-4">YouTube</td>
        <td className="py-2 pr-4">
          {connected ? (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400" /> Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-white/70">
              <span className="size-2 rounded-full bg-white/40" /> Não conectado
            </span>
          )}
        </td>
        <td className="py-2 pr-4">
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <button
                  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  onClick={() => disconnectM.mutate(c.id)}
                >
                  Desconectar
                </button>
                <button
                  className="px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-700"
                  onClick={() => oauthAuthorize('youtube', c.id)}
                >
                  Conectar outra conta
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-700"
                  onClick={() => oauthAuthorize('youtube', c.id)}
                >
                  Conectar YouTube
                </button>
                <GoogleConnect channelId={c.id} />
              </>
            )}
          </div>
          {connected && (
            <div className="mt-2 flex items-center gap-2">
              <select
                className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
                value={rowSelectedExternalId}
                onChange={(e) => setRowSelectedExternalId(e.target.value)}
              >
                {linkedQ.data?.map((lc) => (
                  <option key={lc.external_id} value={lc.external_id}>{lc.name || lc.external_id}</option>
                ))}
              </select>
              <button
                className="px-3 py-1 rounded border border-white/20 text-white text-xs"
                disabled={!rowSelectedExternalId || bindM.isLoading}
                onClick={() => {
                  const chosen = linkedQ.data?.find((x) => x.external_id === rowSelectedExternalId)
                  bindM.mutate({ external_id: rowSelectedExternalId, name: chosen?.name })
                }}
              >
                Vincular canal
              </button>
            </div>
          )}
        </td>
      </tr>
    )
  }

  // ===== Linha por conta vinculada (AccountRow) =====
  const AccountRow: React.FC<{
    group: AccountGroup
  }> = ({ group }) => {
    const firstChannel = group.channels[0]
    const [selectedExternal, setSelectedExternal] = useState('')

    const linkedQ = useQuery({
      queryKey: ['linked-channels', group.platform, firstChannel?.id],
      queryFn: async () => {
        if (!firstChannel?.id) return [] as { id: string; title: string }[]
        const { data } = await api.get(`/oauth/${group.platform}/account/channels`, { params: { channel_id: firstChannel.id } })
        const arr = Array.isArray(data) ? data : []
        return arr.map((x: any) => ({ id: x.id || x.external_id, title: x.title || x.name || x.id }))
      },
      enabled: !!firstChannel?.id,
    })

    useEffect(() => {
      const first = linkedQ.data?.[0]?.id
      if (first) setSelectedExternal(first)
    }, [linkedQ.data])

    return (
      <div className="border border-white/10 rounded-md p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {group.avatar ? (
              <img src={group.avatar} alt={group.name || group.email} className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/10" />
            )}
            <div>
              <div className="text-sm font-medium">{group.name || 'Usuário'}</div>
              <div className="text-xs text-white/70">{group.email} • {group.platform}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded border border-white/20 text-white text-xs"
              onClick={() => setDefaultAccountM.mutate({ platform: group.platform, email: group.email, name: group.name, avatar: group.avatar, channel_id: firstChannel?.id })}
            >
              Definir como padrão
            </button>
            <button
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
              onClick={() => {
                const archive = window.confirm('Ao deslogar, as informações desta conta serão removidas. Deseja arquivar o histórico?')
                logoutAccountM.mutate({ platform: group.platform, email: group.email, archive })
              }}
            >
              Deslogar conta
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-sm font-medium mb-2">Canais:</div>
          <div className="flex items-center gap-2">
            <select
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
              value={selectedExternal}
              onChange={(e) => setSelectedExternal(e.target.value)}
            >
              <option value="">Selecione um canal</option>
              {linkedQ.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button
              className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
              disabled={!selectedExternal || !firstChannel}
              onClick={() => firstChannel && bindExternalChannelM.mutate({ channel_id: firstChannel.id, external_id: selectedExternal })}
            >
              Vincular
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {group.channels.map((c) => (
              <button
                key={c.id}
                className={`px-3 py-2 rounded badge ${c.enabled ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/70'}`}
                onClick={() => toggleChannelEnabledM.mutate({ channel_id: c.id, enabled: !c.enabled })}
                title={c.enabled ? 'Clique para desativar' : 'Clique para ativar'}
              >
                {c.name || c.platform}
                <span className="ml-2 text-xs">{c.enabled ? 'Ativo' : 'Inativo'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="space-y-6 text-white">
      <div>
        <h2 className="text-xl font-semibold mb-1">Configurações</h2>
        <p className="text-sm text-white/70">Publicação auto/manual, targets globais e preferências.</p>
      </div>

      {/* Plataformas Habilitadas/Desabilitadas para Login */}
      <section id="integrations-config" className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold">Plataformas Habilitadas/Desabilitadas para Login</h3>
        <p className="text-sm text-white/70 mt-1">Defina as variáveis de ambiente no backend (.env) para habilitar cada plataforma.</p>
        {integrationsQ.isLoading && (
          <div className="text-sm text-white/70 mt-2">Verificando configurações…</div>
        )}
        {integrationsQ.data && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['youtube','instagram','tiktok','facebook','x'] as const).map((plat) => {
              const st = integrationsQ.data![plat]
              const groupsForPlat = accountGroups.filter((g) => g.platform === plat)
              return (
                <div key={plat} className="rounded border border-white/10 p-3">
                  <div className="font-medium capitalize flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${st?.ready ? 'bg-emerald-400' : 'bg-red-500'}`} />
                    {plat}
                  </div>
                  {st.ready ? (
                    <div className="text-xs text-emerald-400 mt-1">Pronto para conectar</div>
                  ) : (
                    <div className="text-xs text-amber-300 mt-1">
                      Não ativada. {st?.missing?.length ? `Chaves ausentes: ${st.missing.join(', ')}` : ''}
                    </div>
                  )}
                  {st.note && <div className="text-xs text-white/50 mt-1">{st.note}</div>}
                  {!st.ready && (
                    <div className="text-xs text-white/60 mt-2">
                      Necessárias: {st.required?.length ? st.required.join(', ') : '—'}
                    </div>
                  )}
                  <div className="mt-2">
                    {st.ready && (
                      <button
                        className="ml-2 px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-700 text-xs"
                        onClick={() => {
                          setSelectedPlatform(plat)
                          // Selecionar automaticamente um canal base da plataforma para anexar credenciais
                          const firstId = plat === 'youtube' ? youtubeChannels[0]?.id : plat === 'instagram' ? instagramChannels[0]?.id : plat === 'tiktok' ? tiktokChannels[0]?.id : undefined
                          if (!firstId) {
                            toastError('Cadastre ao menos um canal desta plataforma antes de conectar.')
                            return
                          }
                          setSelectedChannelId(firstId || null)
                          setConnectOpen(true)
                        }}
                      >
                        Adicionar contas
                      </button>
                    )}
                  </div>
                  {/* Removido: não exibir contas vinculadas por plataforma */}
                </div>
              )
            })}
          </div>
        )}
        {/* Guia rápido removido conforme solicitado */}
      </section>

      {/* Publicação global removida conforme solicitado */}

      {(channelsQ.isLoading || targetsQ.isLoading) && (
        <div className="text-sm text-white/70">Carregando dados…</div>
      )}

      {connectedCount === 0 && (
        <section className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Nenhuma conexão ativa</h3>
              <p className="text-sm text-white/70 mt-1">Conecte uma rede social para publicar vídeos automaticamente.</p>
            </div>
            <button
              className="px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-700"
              onClick={() => setConnectOpen(true)}
            >
              Conectar rede social
            </button>
          </div>
        </section>
      )}

      {/* Conexões rápidas removidas para simplificar a interface */}

      {/* Contas vinculadas */}
      <section className="hidden rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold">Contas vinculadas</h3>
        <p className="text-sm text-white/70 mt-1">Selecione os canais por conta conectada e gerencie quais ficam ativos.</p>
        {accountGroups.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-white/60 mb-1">Contas conectadas:</div>
            <div className="flex flex-wrap gap-2">
              {accountGroups.map((grp) => {
                const def = settingsQ.data?.meta?.default_account
                const isDefault = def && def.platform === grp.platform && def.email === grp.email
                return (
                  <button
                    key={grp.key}
                    className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-xs ${isDefault ? 'border-emerald-400 text-emerald-300' : 'border-white/20 text-white/80'} hover:border-white/40`}
                    onClick={() => {
                      setAccountDetailsGroup(grp)
                      setAccountDetailsOpen(true)
                    }}
                    title={`${grp.platform} • ${grp.email}`}
                  >
                    {grp.avatar ? (
                      <img src={grp.avatar} className="h-4 w-4 rounded-full" />
                    ) : (
                      <span className="h-4 w-4 rounded-full bg-white/10" />
                    )}
                    <span className="capitalize">{grp.platform}</span>
                    <span>• {grp.name || grp.email}</span>
                    <span className="ml-1 px-1 rounded bg-white/10 text-white/70">{grp.channels.length}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className="mt-3 space-y-3">
          {accountGroups.length === 0 ? (
            <div className="text-sm text-white/60">Nenhuma conta conectada ainda. Use “Adicionar contas” acima.</div>
          ) : (
            accountGroups.map((grp) => (
              <AccountRow key={grp.key} group={grp} />
            ))
          )}
        </div>
      </section>

      {/* AI Providers defaults */}
      <section className="hidden rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold">Providers de IA (padrões)</h3>
        <p className="text-sm text-white/70 mt-1">Selecione provedores para LLM, Imagem, Vídeo e TTS. Suporte a piAPI incluído.</p>
        <div className="mt-2 flex items-center justify-between">
          {(() => {
            const haveLLM = Boolean(settingsQ.data?.llm_provider_id)
            const haveImage = Boolean(settingsQ.data?.image_provider_id)
            const haveVideo = Boolean(settingsQ.data?.video_provider_id)
            const haveTTS = Boolean(settingsQ.data?.tts_provider_id)
            const missing: string[] = []
            if (!haveLLM) missing.push('Texto (LLM)')
            if (!haveImage) missing.push('Imagem')
            if (!haveVideo) missing.push('Vídeo')
            if (!haveTTS) missing.push('TTS')
            if (missing.length > 0) {
              return <div className="text-xs text-amber-300">Falta IA para: {missing.join(', ')}. Os vídeos podem ficar mal feitos por falta de IA.</div>
            }
            return <div className="text-xs text-emerald-300">Mínimo necessário ativo. Sistema pronto para gerar vídeos.</div>
          })()}
          <button className="px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-700" onClick={() => setProviderModalOpen(true)}>Adicionar API</button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm">LLM</label>
            <select
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
              value={settingsQ.data?.llm_provider_id ?? ''}
              onChange={(e) => updateSettingsM.mutate({ llm_provider_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Nenhum</option>
              {(llmProvidersQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Imagem</label>
            <select
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
              value={settingsQ.data?.image_provider_id ?? ''}
              onChange={(e) => updateSettingsM.mutate({ image_provider_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Nenhum</option>
              {(imageProvidersQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Vídeo</label>
            <select
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
              value={settingsQ.data?.video_provider_id ?? ''}
              onChange={(e) => updateSettingsM.mutate({ video_provider_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Nenhum</option>
              {(videoProvidersQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">TTS</label>
            <select
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
              value={settingsQ.data?.tts_provider_id ?? ''}
              onChange={(e) => updateSettingsM.mutate({ tts_provider_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Nenhum</option>
              {(ttsProvidersQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-2 text-xs text-white/60">Dica: providers cujo nome começa com "piapi-" expõem opções avançadas e são preferidos pelo sistema.</div>
      </section>

      {/* Provider Modal */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProviderModalOpen(false)} />
          <div className="relative w-[680px] max-w-[95vw] rounded-lg border border-white/10 bg-zinc-900 p-4">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-sm">Header Key (opcional)</label>
                  <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={headerKey} onChange={(e) => setHeaderKey(e.target.value)} placeholder="X-API-Key" />
                </div>
                <div className="md:col-span-2 flex items-end gap-2">
                  <button className="px-3 py-2 rounded bg-teal-700 text-white text-sm h-[36px]" onClick={discoverGlobal} disabled={!apiBase || !apiKey}>
                    Buscar modelos
                  </button>
                  {(discoveredLLM.length + discoveredImage.length + discoveredVideo.length + discoveredTTS.length) > 0 && (
                    <span className="text-xs text-white/70">{discoveredLLM.length + discoveredImage.length + discoveredVideo.length + discoveredTTS.length} modelos detectados</span>
                  )}
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
                          <select className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={defaultLLM} onChange={(e) => setDefaultLLM(e.target.value)}>
                            {(discoveredLLM.length ? discoveredLLM : parseModels(modelsLLM)).map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
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
                          <select className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={defaultImage} onChange={(e) => setDefaultImage(e.target.value)}>
                            {(discoveredImage.length ? discoveredImage : parseModels(modelsImage)).map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
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
                          <select className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={defaultVideo} onChange={(e) => setDefaultVideo(e.target.value)}>
                            {(discoveredVideo.length ? discoveredVideo : parseModels(modelsVideo)).map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
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
                          <select className="w-full bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={defaultTTS} onChange={(e) => setDefaultTTS(e.target.value)}>
                            {(discoveredTTS.length ? discoveredTTS : parseModels(modelsTTS)).map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
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

      {/* Connect Modal */}
      {isConnectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConnectOpen(false)} />
          <div className="relative w-[560px] max-w-[90vw] rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Conectar rede social</div>
              <button className="text-white/70 hover:text-white" onClick={() => setConnectOpen(false)}>✕</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {selectedPlatform ? (
                <div className="flex items-center justify-between">
                  <div className="text-sm">Plataforma selecionada</div>
                  <div className="px-2 py-1 rounded border border-white/20 text-xs capitalize">{selectedPlatform}</div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm">Plataforma</label>
                  <select
                    className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
                    value={selectedPlatform}
                    onChange={(e) => {
                      const val = e.target.value as any
                      setSelectedPlatform(val)
                    }}
                  >
                    <option value="">Selecionar</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
              )}
              <div className="text-xs text-white/70">Conexão via OAuth ({selectedPlatform === 'youtube' ? 'Google' : selectedPlatform === 'instagram' ? 'Meta' : selectedPlatform === 'tiktok' ? 'TikTok' : 'Google/Meta/TikTok'}).</div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <button className="px-3 py-1 rounded border border-white/20 text-white" onClick={() => setConnectOpen(false)}>Cancelar</button>
                <button
                  className="px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                  disabled={!selectedPlatform}
                  onClick={() => {
                    // Usar o canal previamente definido (primeiro da plataforma) para anexar credenciais
                    const channelId = selectedChannelId || (selectedPlatform === 'youtube' ? youtubeChannels[0]?.id : selectedPlatform === 'instagram' ? instagramChannels[0]?.id : selectedPlatform === 'tiktok' ? tiktokChannels[0]?.id : null)
                    if (!channelId) {
                      toastError('Cadastre ao menos um canal desta plataforma antes de conectar.')
                      return
                    }
                    setPendingDefaultChannelId(channelId)
                    oauthAuthorize(selectedPlatform || '', channelId)
                    toastSuccess('Após concluir o consentimento, feche esta modal e atualize a página.')
                  }}
                >
                  {selectedPlatform === 'youtube' ? 'Conectar com Google' : selectedPlatform === 'instagram' ? 'Conectar com Meta' : selectedPlatform === 'tiktok' ? 'Conectar TikTok' : 'Conectar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keys Modal */}
      {isKeysModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setKeysModalOpen(false)} />
          <div className="relative w-[560px] max-w-[90vw] rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Configurar chaves – {keysPlatform}</div>
              <button className="text-white/70 hover:text-white" onClick={() => setKeysModalOpen(false)}>✕</button>
            </div>
            <div className="mt-4 space-y-2">
              {Object.keys(keyValues).length === 0 && (
                <div className="text-sm text-white/70">Sem chaves definidas. Preencha abaixo.</div>
              )}
              {Object.entries(keyValues).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1">
                  <label className="text-xs">{k}</label>
                  <input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" value={v} onChange={(e) => updateKey(k, e.target.value)} placeholder={k} />
                </div>
              ))}
              {Object.keys(keyValues).length === 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {keysPlatform === 'youtube' && (
                    <>
                      <div className="flex flex-col gap-1"><label className="text-xs">GOOGLE_CLIENT_ID</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('GOOGLE_CLIENT_ID', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">GOOGLE_CLIENT_SECRET</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('GOOGLE_CLIENT_SECRET', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">GOOGLE_API_KEY (opcional)</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('GOOGLE_API_KEY', e.target.value)} placeholder="chave do projeto Google" /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">YT_REDIRECT_URI</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('YT_REDIRECT_URI', e.target.value)} placeholder="http://localhost:8000/api/v1/oauth/youtube/callback" /></div>
                    </>
                  )}
                  {keysPlatform === 'instagram' && (
                    <>
                      <div className="flex flex-col gap-1"><label className="text-xs">META_APP_ID</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('META_APP_ID', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">META_APP_SECRET</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('META_APP_SECRET', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">META_REDIRECT_URI</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('META_REDIRECT_URI', e.target.value)} placeholder="http://localhost:8000/api/v1/oauth/instagram/callback" /></div>
                    </>
                  )}
                  {keysPlatform === 'tiktok' && (
                    <>
                      <div className="flex flex-col gap-1"><label className="text-xs">TIKTOK_CLIENT_KEY</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('TIKTOK_CLIENT_KEY', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">TIKTOK_CLIENT_SECRET</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('TIKTOK_CLIENT_SECRET', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">TIKTOK_REDIRECT_URI</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('TIKTOK_REDIRECT_URI', e.target.value)} /></div>
                    </>
                  )}
                  {keysPlatform === 'facebook' && (
                    <>
                      <div className="flex flex-col gap-1"><label className="text-xs">FB_APP_ID</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('FB_APP_ID', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">FB_APP_SECRET</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('FB_APP_SECRET', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">FB_REDIRECT_URI</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('FB_REDIRECT_URI', e.target.value)} /></div>
                    </>
                  )}
                  {keysPlatform === 'x' && (
                    <>
                      <div className="flex flex-col gap-1"><label className="text-xs">X_CLIENT_ID</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('X_CLIENT_ID', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">X_CLIENT_SECRET</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('X_CLIENT_SECRET', e.target.value)} /></div>
                      <div className="flex flex-col gap-1"><label className="text-xs">X_REDIRECT_URI</label><input className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm" onChange={(e) => updateKey('X_REDIRECT_URI', e.target.value)} /></div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-1 rounded border border-white/20 text-white" onClick={() => setKeysModalOpen(false)}>Cancelar</button>
              <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={saveKeys}>Salvar e validar</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Google JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setImportModalOpen(false)} />
          <div className="relative w-[520px] max-w-[90vw] rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Importar JSON do Google</div>
              <button className="text-white/70 hover:text-white" onClick={() => setImportModalOpen(false)}>✕</button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-white/70">Anexe o arquivo de credenciais OAuth do Google (client_secret.json ou semelhante).</div>
              <input
                type="file"
                accept=".json,application/json"
                className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm w-full"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <div className="text-xs text-white/50">O sistema extrai <code>client_id</code>, <code>client_secret</code> e <code>redirect_uris</code> automaticamente.</div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-1 rounded border border-white/20 text-white" onClick={() => setImportModalOpen(false)}>Cancelar</button>
              <button className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700" onClick={confirmImportGoogleJSON} disabled={!importFile}>Importar</button>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      {isAccountDetailsOpen && accountDetailsGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAccountDetailsOpen(false)} />
          <div className="relative w-[680px] max-w-[95vw] rounded-lg border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Detalhes da conta – {accountDetailsGroup.platform}</div>
              <button className="text-white/70 hover:text-white" onClick={() => setAccountDetailsOpen(false)}>✕</button>
            </div>
            <div className="mt-4">
              <AccountRow group={accountDetailsGroup} />
            </div>
            <div className="mt-4 flex items-center justify-end">
              <button className="px-3 py-1 rounded border border-white/20 text-white" onClick={() => setAccountDetailsOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
  // Descoberta global de modelos do provedor
  const discoverGlobal = async () => {
    try {
      const res = await api.post('/piapi/discover', { api_base: apiBase, api_key: apiKey, header_key: headerKey })
      const kinds = res.data?.kinds || {}
      const llm = kinds.llm || []
      const img = kinds.image || []
      const vid = kinds.video || []
      const tts = kinds.tts || []
      setDiscoveredLLM(llm)
      setDiscoveredImage(img)
      setDiscoveredVideo(vid)
      setDiscoveredTTS(tts)
      // Atualiza estados compatíveis de string (fallback)
      setModelsLLM(llm.join(', '))
      setModelsImage(img.join(', '))
      setModelsVideo(vid.join(', '))
      setModelsTTS(tts.join(', '))
      // Define defaults (primeiro da lista)
      if (llm.length > 0) setDefaultLLM(llm[0])
      if (img.length > 0) setDefaultImage(img[0])
      if (vid.length > 0) setDefaultVideo(vid[0])
      if (tts.length > 0) setDefaultTTS(tts[0])
      toastSuccess('Modelos descobertos da API')
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao descobrir modelos da API')
    }
  }