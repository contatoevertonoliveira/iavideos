import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDetail } from '@/api/adapter'
import { cn } from '@/lib/utils'

export default function StoryDetail() {
  const { id } = useParams()
  const q = useQuery({
    queryKey: ['story', id],
    queryFn: async () => getDetail(String(id)),
    enabled: !!id,
  })
  const d = q.data

  const mediaUrl = Array.isArray(d?.sources) && d?.sources[0]?.url ? d.sources[0].url : ''
  const kind = String(d?.type || '').toLowerCase()

  return (
    <div className="container-fluid">
      <div className="space-y-4">
      {d?.backdrop_path && (
        <div
          className={cn('relative overflow-hidden rounded-2xl border border-cine')}
          style={{ backgroundImage: `url(${d.backdrop_path})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 gradient-cine opacity-40" />
      <div className="relative p-6 md:p-8 bg-[var(--cine-surface)]/60">
            <h1 className="text-2xl md:text-3xl font-semibold neural-heading tracking-tight text-cine">{d.title}</h1>
            {d.overview && <p className="text-cine-muted mt-1 max-w-3xl">{d.overview}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 neural-card p-4">
          {kind === 'video' && mediaUrl && (
            <video controls src={mediaUrl} className="w-full h-full aspect-video rounded-xl border border-cine" />
          )}
          {kind === 'image' && (d?.poster_path || mediaUrl) && (
            <img src={d.poster_path || mediaUrl} alt={d.title} className="w-full h-auto rounded-xl border border-cine" />
          )}
          {kind === 'audio' && mediaUrl && (
            <audio controls src={mediaUrl} className="w-full" />
          )}
          {!mediaUrl && !d?.poster_path && (
            <div className="text-cine-muted text-sm">Sem mídia disponível para esta criação.</div>
          )}
        </div>
        <div className="neural-card p-4 space-y-2">
          <div className="text-sm text-cine-muted">Metadados</div>
          <div className="text-cine text-sm">Tipo: {d?.type || '—'}</div>
          {Array.isArray(d?.genres) && d.genres.length > 0 && (
            <div className="text-cine text-sm">Tags: {d.genres.map((g: any) => g.name).join(', ')}</div>
          )}
          {d?.runtime ? (
            <div className="text-cine text-sm">Duração: {Math.round((d.runtime as number) / 60)} min</div>
          ) : null}
          <div className="text-cine-muted text-xs">ID: {d?.id}</div>
        </div>
      </div>
    </div>
    </div>
  )
}