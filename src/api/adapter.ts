import { api } from '@/lib/api'

// Adapter para consumir o backend próprio e expor dados no formato esperado
// pelos componentes herdados do react-movie (poster_path, backdrop_path, etc.)

type CreationItem = {
  id: string | number
  title?: string
  name?: string
  description?: string
  thumb_url?: string
  backdrop_url?: string
  score?: number
  kind?: 'video' | 'image' | 'audio' | string
  duration?: number
  tags?: string[]
  sources?: Array<{ url?: string; type?: string; label?: string }>
}

type ListResponse = { items: CreationItem[] }

export async function listTrending() {
  const { data } = await api.get<ListResponse>('/creations/trending')
  const items = Array.isArray(data?.items) ? data.items : []
  return items.map((x) => ({
    id: x.id,
    title: x.title || x.name || '',
    overview: x.description || '',
    poster_path: x.thumb_url || '',
    backdrop_path: x.backdrop_url || '',
    vote_average: x.score ?? 0,
    type: x.kind || '',
  }))
}

export async function listByCategory(cat: string) {
  const { data } = await api.get<ListResponse>('/creations', { params: { category: cat } })
  const items = Array.isArray(data?.items) ? data.items : []
  return items.map((x) => ({
    id: x.id,
    title: x.title || x.name || '',
    poster_path: x.thumb_url || '',
    vote_average: x.score ?? 0,
  }))
}

export async function getDetail(id: string | number) {
  const { data: x } = await api.get<CreationItem>(`/creations/${id}`)
  return {
    id: x.id,
    title: x.title || x.name || '',
    overview: x.description || '',
    poster_path: x.thumb_url || '',
    backdrop_path: x.backdrop_url || '',
    runtime: x.duration ?? 0,
    genres: (x.tags || []).map((t) => ({ name: t })),
    vote_average: x.score ?? 0,
    type: x.kind || '',
    sources: x.sources || [],
  }
}