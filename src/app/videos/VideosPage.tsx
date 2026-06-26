import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Play, Film, Clock, CheckCircle, XCircle, AlertCircle, Eye, ThumbsUp } from 'lucide-react'

type Video = {
  id: number
  title?: string
  file_name?: string
  status?: 'completed' | 'processing' | 'failed' | 'pending'
  duration_secs?: number | null
  thumb_url?: string | null
  views?: number
  likes?: number
  created_at?: string
  mime_type?: string
  size_bytes?: number
  job_id?: number | null
  series_id?: number | null
  series_name?: string | null
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: 'Concluído', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  processing: { label: 'Processando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: AlertCircle },
  failed: { label: 'Falha', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
}

function formatDuration(secs?: number | null): string {
  if (!secs) return '--:--'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function VideosPage() {
  const [tipo, setTipo] = useState<string>('')

  const { data, isLoading } = useQuery<Video[]>({
    queryKey: ['videos', { tipo }],
    queryFn: async () => {
      const params: any = { limit: 50 }
      if (tipo) params.tipo = tipo
      const { data } = await api.get('/media', { params })
      return Array.isArray(data) ? data : (data?.items || [])
    },
    staleTime: 15_000,
  })

  const videos = (data || []).filter((v) => {
    if (!tipo) return true
    return v.mime_type?.startsWith(tipo)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-cine">
        <div className="absolute inset-0 gradient-cine opacity-20" />
        <div className="relative p-6 md:p-8 bg-cine-surface">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-cine">Vídeos</h1>
            <p className="text-cine-muted mt-1">Todos os vídeos gerados, processados e publicados.</p>
          </div>
        </div>
      </div>

      {/* Summary & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: '', label: 'Todos' },
            { key: 'video', label: 'Vídeos' },
            { key: 'image', label: 'Imagens' },
            { key: 'audio', label: 'Áudios' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTipo(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                tipo === tab.key
                  ? 'bg-cine-hover text-cine border border-cine'
                  : 'text-cine-muted hover:text-cine hover:bg-cine-hover'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-cine-muted">
          {videos.length} item(ns)
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-cine bg-cine-surface overflow-hidden animate-pulse">
              <div className="aspect-video bg-cine-hover" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-cine-hover rounded" />
                <div className="h-3 w-1/2 bg-cine-hover rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-2xl bg-cine-surface border border-cine flex items-center justify-center mb-6">
            <Film className="h-10 w-10 text-cine-muted" />
          </div>
          <h2 className="text-xl font-semibold text-cine mb-2">Nenhum vídeo encontrado</h2>
          <p className="text-sm text-cine-muted max-w-md">
            Os vídeos gerados aparecerão aqui. Crie uma série para começar a produzir conteúdo.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-cine text-white font-medium shadow-cine hover:opacity-90 transition-opacity"
          >
            Criar novo vídeo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => {
            const st = video.status ? statusConfig[video.status] || statusConfig.pending : statusConfig.pending
            const fileUrl = `${api.defaults.baseURL}/media/${video.id}/file`
            const thumbUrl = `${api.defaults.baseURL}/media/${video.id}/thumbnail`

            return (
              <div
                key={video.id}
                className="group rounded-xl border border-cine bg-cine-surface overflow-hidden hover:border-[var(--cine-primary)]/30 transition-all duration-200"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-cine-hover relative overflow-hidden">
                  <img
                    src={thumbUrl}
                    alt={video.title || video.file_name || ''}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = ''
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  {!video.thumb_url && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="h-12 w-12 text-cine-muted/30" />
                    </div>
                  )}
                  {/* Duration overlay */}
                  {video.duration_secs ? (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-[11px] text-white">
                      {formatDuration(video.duration_secs)}
                    </div>
                  ) : null}
                  {/* Status */}
                  <div className="absolute top-2 left-2">
                    <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1', st.color)}>
                      <st.icon className="h-3 w-3" />
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-cine truncate" title={video.title || video.file_name}>
                        {video.title || video.file_name || `Vídeo #${video.id}`}
                      </h3>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-cine-muted">
                    {video.series_name && (
                      <span className="px-1.5 py-0.5 rounded bg-cine-hover text-[10px] truncate max-w-[120px]">
                        {video.series_name}
                      </span>
                    )}
                    {video.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(video.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {video.size_bytes ? (
                      <span className="ml-auto">{formatBytes(video.size_bytes)}</span>
                    ) : null}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-cine-hover text-cine hover:bg-cine-hover/80 transition-colors"
                    >
                      Abrir
                    </a>
                    {video.job_id && (
                      <Link
                        to={`/jobs/${video.job_id}`}
                        className="text-xs px-2 py-1.5 rounded-lg bg-cine-hover text-cine hover:bg-cine-hover/80 transition-colors"
                      >
                        Job #{video.job_id}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
