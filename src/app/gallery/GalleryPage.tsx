import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toastSuccess, toastError, toastInfo } from '@/lib/toast'
import { cn } from '@/lib/utils'

type MediaItem = {
  id: number
  file_name: string
  mime_type?: string | null
  size_bytes?: number | null
  duration_secs?: number | null
  group?: 'video' | 'image' | 'audio' | 'other' | null
  thumb_path?: string | null
  created_at?: string | null
}

export default function GalleryPage() {
  const qc = useQueryClient()
  const [tipo, setTipo] = React.useState<string>('')
  const [q, setQ] = React.useState<string>('')
  const [page, setPage] = React.useState<number>(1)
  const [limit, setLimit] = React.useState<number>(24)
  const [thumbRunning, setThumbRunning] = React.useState<Record<number, boolean>>({})
  const [transcodeRunning, setTranscodeRunning] = React.useState<Record<number, boolean>>({})

  const { data, isLoading } = useQuery<{ items: MediaItem[]; total: number; page: number; limit: number; has_next: boolean }>({
    queryKey: ['media', { tipo, q, page, limit }],
    queryFn: async () => {
      const params: any = { page, limit }
      if (tipo) params.tipo = tipo
      if (q) params.q = q
      const { data } = await api.get('/media', { params })
      if (Array.isArray(data)) {
        return { items: data as MediaItem[], total: data.length, page: 1, limit: data.length, has_next: false }
      }
      return data
    },
    staleTime: 10_000,
  })

  const delMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/media/${id}`)
    },
    onSuccess: () => {
      toastSuccess('Item excluído')
      qc.invalidateQueries({ queryKey: ['media'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao excluir'),
  })

  const transcodeMut = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/media/${id}/transcode`, { preset: '1080p_mp4' })
    },
    onSuccess: (_data, id) => {
      toastInfo('Transcode enfileirado')
      try {
        setTranscodeRunning(prev => ({ ...prev, [id]: true }))
        const es = new EventSource(`${api.defaults.baseURL}/media/${id}/transcode/events`)
        es.addEventListener('status', (ev: MessageEvent) => {
          try {
            const payload = JSON.parse(ev.data)
            if (payload.status === 'completed') {
              es.close()
              setTranscodeRunning(prev => ({ ...prev, [id]: false }))
              toastSuccess('Transcode concluído')
              qc.invalidateQueries({ queryKey: ['media'] })
            }
          } catch {}
        })
        es.addEventListener('error', () => {
          es.close()
          setTranscodeRunning(prev => ({ ...prev, [id]: false }))
        })
      } catch {}
    },
    onError: () => toastError('Falha ao enfileirar transcode'),
  })

  const thumbMut = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/media/${id}/thumbnail`, { at: '00:00:02' })
    },
    onSuccess: (_data, id) => {
      toastInfo('Thumbnail enfileirada')
      try {
        setThumbRunning(prev => ({ ...prev, [id]: true }))
        const es = new EventSource(`${api.defaults.baseURL}/media/${id}/thumbnail/events`)
        es.addEventListener('status', (ev: MessageEvent) => {
          try {
            const payload = JSON.parse(ev.data)
            if (payload.status === 'completed') {
              es.close()
              setThumbRunning(prev => ({ ...prev, [id]: false }))
              toastSuccess('Thumbnail pronta')
              qc.invalidateQueries({ queryKey: ['media'] })
            }
            if (payload.status === 'timeout') {
              es.close()
              setThumbRunning(prev => ({ ...prev, [id]: false }))
              toastError('Timeout ao gerar thumbnail')
            }
          } catch {}
        })
        es.addEventListener('error', () => {
          es.close()
          setThumbRunning(prev => ({ ...prev, [id]: false }))
        })
      } catch {}
    },
    onError: () => toastError('Falha ao enfileirar thumbnail'),
  })

  const uploadInputRef = React.useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = React.useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post('/media/upload', form)
      toastSuccess('Upload concluído')
      qc.invalidateQueries({ queryKey: ['media'] })
    } catch (err: any) {
      toastError(err?.response?.data?.detail || 'Falha no upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const items = data?.items || []
  const total = data?.total || 0
  const hasNext = !!data?.has_next
  const fileUrl = (id: number) => `${api.defaults.baseURL}/media/${id}/file`
  const thumbUrl = (id: number) => `${api.defaults.baseURL}/media/${id}/thumbnail`

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Galeria</h1>
          <p className="text-sm text-gray-600 dark:text-white/60">Uploads, prévias e resultados salvos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => uploadInputRef.current?.click()}
            className={cn('px-3 py-2 rounded bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B] dark:bg-[#FFD700] dark:text-[#052c65]', uploading && 'opacity-60 cursor-not-allowed')}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : 'Upload'}
          </button>
          <input ref={uploadInputRef} type="file" className="hidden" onChange={handleUpload} />
          <Link to="/create" className="px-3 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">Criar novo</Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap gap-3 mb-4">
          <select value={tipo} onChange={e=>{ setTipo(e.target.value); setPage(1) }} className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-800 dark:bg-[#16132B] dark:border-white/10 dark:text-white">
            <option value="">Todos</option>
            <option value="video">Vídeos</option>
            <option value="image">Imagens</option>
            <option value="audio">Áudios</option>
          </select>
          <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1) }} placeholder="Buscar pelo nome" className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-800 w-48 dark:bg-[#16132B] dark:border-white/10 dark:text-white" />
          <select value={limit} onChange={e=>{ setLimit(Number(e.target.value)); setPage(1) }} className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-800 dark:bg-[#16132B] dark:border-white/10 dark:text-white">
            <option value={12}>12/página</option>
            <option value={24}>24/página</option>
            <option value={48}>48/página</option>
          </select>
          {isLoading && <span className="text-xs text-gray-600 dark:text-white/70">Carregando...</span>}
        </div>

        <div className="flex items-center justify-between mb-3 text-xs text-gray-600 dark:text-white/70">
          <div>Total: {total}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 dark:bg-white/10 dark:hover:bg-white/20"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >Anterior</button>
            <span>Página {page}</span>
            <button
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 dark:bg-white/10 dark:hover:bg-white/20"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext}
            >Próxima</button>
          </div>
        </div>

        {items.length === 0 && !isLoading && (
          <div className="text-sm text-white/70">Nenhum item para mostrar.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((m) => (
            <div key={m.id} className="rounded-lg overflow-hidden border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1C1835]">
              <div className="aspect-video bg-gray-100 dark:bg-black/30 flex items-center justify-center">
                {m.group === 'image' ? (
                  <img src={(m.thumb_path ? thumbUrl(m.id) : fileUrl(m.id))} alt={m.file_name} className="h-full w-full object-cover" />
                ) : m.group === 'video' ? (
                  <img src={(m.thumb_path ? thumbUrl(m.id) : fileUrl(m.id))} alt={m.file_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-gray-600 dark:text-white/60 text-sm">{m.mime_type || 'arquivo'}</div>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={m.file_name}>{m.file_name}</div>
                <div className="text-xs text-gray-600 dark:text-white/50">{m.group || 'other'} · {m.created_at?.slice(0, 10) || ''}</div>
                <div className="mt-3 flex items-center gap-2">
                  <a href={fileUrl(m.id)} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20">Abrir</a>
                  <button onClick={() => transcodeMut.mutate(m.id)} className={cn('text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20', transcodeRunning[m.id] && 'opacity-60 cursor-not-allowed')} disabled={!!transcodeRunning[m.id]}>
                    {transcodeRunning[m.id] ? 'Processando...' : 'Transcode'}
                  </button>
                  <button onClick={() => thumbMut.mutate(m.id)} className={cn('text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20', thumbRunning[m.id] && 'opacity-60 cursor-not-allowed')} disabled={!!thumbRunning[m.id]}>
                    {thumbRunning[m.id] ? 'Gerando...' : 'Thumbnail'}
                  </button>
                  <button onClick={() => delMut.mutate(m.id)} className="ml-auto text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-500/20 dark:hover:bg-red-500/40 dark:text-red-200">Excluir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}