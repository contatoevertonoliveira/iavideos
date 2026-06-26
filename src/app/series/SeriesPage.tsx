import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Plus, Play, Settings, MoreHorizontal, Film, Clock, BarChart3 } from 'lucide-react'

type Series = {
  id: number
  name: string
  description?: string | null
  thumbnail_url?: string | null
  video_count?: number
  status?: 'active' | 'paused' | 'draft'
  created_at?: string
  updated_at?: string
  category?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  paused: { label: 'Pausado', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  draft: { label: 'Rascunho', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-20 w-20 rounded-2xl bg-cine-surface border border-cine flex items-center justify-center mb-6">
        <Film className="h-10 w-10 text-cine-muted" />
      </div>
      <h2 className="text-xl font-semibold text-cine mb-2">Nenhuma série criada</h2>
      <p className="text-sm text-cine-muted max-w-md mb-8">
        Crie sua primeira série para começar a gerar vídeos automáticos com IA. Escolha um tema e nossa plataforma cuidará do resto.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-cine text-white font-medium shadow-cine hover:opacity-90 transition-opacity"
      >
        <Plus className="h-5 w-5" />
        Criar nova série
      </button>
    </div>
  )
}

export default function SeriesPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<string>('all')

  const { data, isLoading } = useQuery<Series[]>({
    queryKey: ['series'],
    queryFn: async () => {
      const { data } = await api.get('/series', { params: { limit: 50 } })
      return Array.isArray(data) ? data : (data?.items || data?.series || [])
    },
    staleTime: 30_000,
  })

  const series = (data || []).filter((s) => {
    if (filter === 'all') return true
    return s.status === filter
  })

  const stats = React.useMemo(() => {
    const all = data || []
    return {
      total: all.length,
      active: all.filter((s) => s.status === 'active').length,
      videos: all.reduce((acc, s) => acc + (s.video_count || 0), 0),
    }
  }, [data])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-cine">
        <div className="absolute inset-0 gradient-cine opacity-20" />
        <div className="relative p-6 md:p-8 bg-cine-surface">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-cine">Séries</h1>
              <p className="text-cine-muted mt-1">Gerencie suas séries de vídeos automatizadas com IA.</p>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-cine text-white font-medium shadow-cine hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Nova série
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-cine bg-cine-surface p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg gradient-cine flex items-center justify-center">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-cine">{stats.total}</div>
              <div className="text-xs text-cine-muted">Total de séries</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cine bg-cine-surface p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Play className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-cine">{stats.active}</div>
              <div className="text-xs text-cine-muted">Séries ativas</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cine bg-cine-surface p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-cine">{stats.videos}</div>
              <div className="text-xs text-cine-muted">Vídeos gerados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'active', label: 'Ativas' },
          { key: 'paused', label: 'Pausadas' },
          { key: 'draft', label: 'Rascunhos' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === tab.key
                ? 'bg-cine-hover text-cine border border-cine'
                : 'text-cine-muted hover:text-cine hover:bg-cine-hover'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Series Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-cine bg-cine-surface p-4 animate-pulse">
              <div className="aspect-video rounded-lg bg-cine-hover mb-3" />
              <div className="h-5 w-3/4 bg-cine-hover rounded mb-2" />
              <div className="h-4 w-1/2 bg-cine-hover rounded" />
            </div>
          ))}
        </div>
      ) : series.length === 0 ? (
        <EmptyState onCreate={() => navigate('/create')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.map((s) => {
            const st = statusConfig[s.status || 'draft']
            return (
              <Link
                key={s.id}
                to={`/series/${s.id}`}
                className="group rounded-xl border border-cine bg-cine-surface overflow-hidden hover:border-[var(--cine-primary)]/30 transition-all duration-200 no-underline"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-cine-hover relative overflow-hidden">
                  {s.thumbnail_url ? (
                    <img src={s.thumbnail_url} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Film className="h-12 w-12 text-cine-muted/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-2 left-2">
                    <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium border', st.color)}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-cine truncate group-hover:text-[var(--cine-primary)] transition-colors">
                        {s.name}
                      </h3>
                      {s.description && (
                        <p className="text-xs text-cine-muted mt-1 line-clamp-2">{s.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-cine-muted">
                    <span className="flex items-center gap-1">
                      <Film className="h-3 w-3" />
                      {s.video_count || 0} vídeos
                    </span>
                    {s.created_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {s.category && (
                      <span className="px-1.5 py-0.5 rounded bg-cine-hover text-[10px]">
                        {s.category}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
