import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

type ProviderStatusItem = {
  id: number
  name: string
  kind: 'llm' | 'image' | 'video' | 'tts' | 'stt'
  enabled: boolean
  state: 'connected' | 'disconnected' | 'unstable'
}

export type AiStatus = {
  loading: boolean
  items: ProviderStatusItem[]
  byKind: Record<string, ProviderStatusItem[]>
  llmOk: boolean
  imageOk: boolean
  videoOk: boolean
  ttsOk: boolean
}

export function useAiStatus(): AiStatus {
  const q = useQuery<ProviderStatusItem[]>({
    queryKey: ['providers', 'status'],
    queryFn: async () => (await api.get('/providers/status')).data,
    staleTime: 5000,
    refetchInterval: 10000,
  })

  const items = q.data ?? []
  const byKind: Record<string, ProviderStatusItem[]> = items.reduce((acc, it) => {
    const arr = acc[it.kind] ?? []
    arr.push(it)
    acc[it.kind] = arr
    return acc
  }, {} as Record<string, ProviderStatusItem[]>)

  const isOk = (kind: string) => (byKind[kind] ?? []).some((p) => p.enabled && p.state === 'connected')

  return {
    loading: q.isLoading,
    items,
    byKind,
    llmOk: isOk('llm'),
    imageOk: isOk('image'),
    videoOk: isOk('video'),
    ttsOk: isOk('tts'),
  }
}