import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type Provider = {
  id: number
  name: string
  kind: 'llm' | 'image' | 'video' | 'tts' | 'stt'
  enabled: boolean
  api_base?: string | null
  api_key?: string | null
  meta?: Record<string, any>
}

export type ProviderStatus = { id: number; state: 'connected' | 'disconnected' | 'unstable' }

export function useProviders(kind?: Provider['kind']) {
  const qc = useQueryClient()

  const listQ = useQuery<Provider[]>({
    queryKey: ['providers', kind || 'all'],
    queryFn: async () => {
      if (kind) return (await api.get('/providers', { params: { kind } })).data
      return (await api.get('/providers')).data
    },
    staleTime: 30_000,
  })

  const statusQ = useQuery<ProviderStatus[]>({
    queryKey: ['providers', 'status'],
    queryFn: async () => (await api.get('/providers/status')).data,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  const createM = useMutation({
    mutationFn: async (body: { name: string; kind: Provider['kind']; api_base?: string; api_key?: string; meta?: Record<string, any>; enabled?: boolean }) =>
      (await api.post('/providers', body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] })
    },
  })

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Pick<Provider, 'name' | 'api_base' | 'api_key' | 'enabled' | 'meta'>> }) =>
      (await api.put(`/providers/${id}`, data)).data,
    onSuccess: (res: Provider) => {
      qc.invalidateQueries({ queryKey: ['providers', res.kind] })
    },
  })

  const toggleM = useMutation({
    mutationFn: async (id: number) => (await api.patch(`/providers/${id}/toggle`)).data,
    onSuccess: (res: Provider) => {
      qc.invalidateQueries({ queryKey: ['providers', res.kind] })
    },
  })

  const discover = async (base_url: string, api_key: string, header_key = 'X-API-Key', name?: string) => {
    const res = await api.post('/ai/providers/discover', { base_url, api_key, header_key, name })
    return res.data?.provider as any
  }

  // Health & Quota polling (5 minutes)
  const healthQ = useQuery<{ providers: any[] }>({
    queryKey: ['ai','providers','health'],
    queryFn: async () => (await api.get('/ai/providers/health')).data,
    refetchInterval: 300_000,
    staleTime: 60_000,
  })
  const quotaQ = useQuery<{ providers: any[] }>({
    queryKey: ['ai','providers','quota'],
    queryFn: async () => (await api.get('/ai/providers/quota')).data,
    refetchInterval: 300_000,
    staleTime: 60_000,
  })

  // Routing rules
  const getRoutes = async () => (await api.get('/ai/providers/routes')).data
  const setRoutes = async (routes: any) => (await api.put('/ai/providers/routes', routes)).data

  return { listQ, statusQ, healthQ, quotaQ, createM, updateM, toggleM, discover, getRoutes, setRoutes }
}