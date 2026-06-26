import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { listTrending, listByCategory } from '@/api/adapter'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

function Grid({ items }: { items: Array<{ id: string | number; title: string; poster_path?: string; vote_average?: number }> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((it) => (
        <Link key={it.id} to={`/stories/${it.id}`} className={cn('movie-card p-2 no-underline')}
        >
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-cine">
            <img src={it.poster_path || '/vite.svg'} alt={it.title} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/vite.svg' }} />
          </div>
          <div className="mt-2 text-cine text-sm line-clamp-1">{it.title}</div>
          {typeof it.vote_average === 'number' && (
            <div className="text-cine-muted text-xs">Score: {it.vote_average.toFixed(1)}</div>
          )}
        </Link>
      ))}
    </div>
  )
}

export default function CollectionsPage() {
  const trendingQ = useQuery({ queryKey: ['collections', 'trending'], queryFn: listTrending })
  const videosQ = useQuery({ queryKey: ['collections', 'video'], queryFn: () => listByCategory('video') })
  const imagesQ = useQuery({ queryKey: ['collections', 'image'], queryFn: () => listByCategory('image') })
  const audioQ = useQuery({ queryKey: ['collections', 'audio'], queryFn: () => listByCategory('audio') })

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-cine">
        <div className="absolute inset-0 gradient-cine opacity-30" />
        <div className="relative p-6 md:p-8 bg-cine-surface">
          <h1 className="text-2xl md:text-3xl font-semibold neural-heading tracking-tight text-cine">Coleções</h1>
          <p className="text-cine-muted mt-1">Playlists e agrupamentos de criações.</p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-cine">Criações em alta</h2>
        </div>
        <Grid items={(trendingQ.data ?? []) as any} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-cine">Últimos Vídeos / Shorts</h2>
        </div>
        <Grid items={(videosQ.data ?? []) as any} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-cine">Imagens recentes</h2>
        </div>
        <Grid items={(imagesQ.data ?? []) as any} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-cine">Músicas & Áudios</h2>
        </div>
        <Grid items={(audioQ.data ?? []) as any} />
      </section>
    </div>
    </div>
  )
}