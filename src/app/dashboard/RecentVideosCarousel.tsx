import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

type Job = { id: number; status: string; channel_id: number | null }

export default function RecentVideosCarousel() {
  const [items, setItems] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await api.get('/jobs', { params: { limit: 50 } })
        if (!mounted) return
        setItems(resp.data as Job[])
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const recent = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.id - a.id)
    return sorted.filter((j) => ['RENDERED', 'PUBLISHED', 'APPROVED'].includes(j.status)).slice(0, 12)
  }, [items])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Últimos vídeos/shorts</div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-3 snap-x snap-mandatory">
          {loading && (
            <div className="h-36 w-full rounded-lg border border-slate-800 bg-slate-900/40 animate-pulse" />
          )}
          {!loading && recent.map((j) => (
            <a key={j.id} href={`#/jobs/${j.id}`} className="snap-start shrink-0 w-56">
              <div className="relative">
                <img
                  src={`${api.defaults.baseURL}/jobs/${j.id}/thumb`}
                  alt={`thumb-${j.id}`}
                  className="aspect-video w-full object-cover rounded"
                />
                <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">{j.status}</span>
              </div>
            </a>
          ))}
          {!loading && recent.length === 0 && (
            <div className="text-sm text-slate-500">Sem vídeos recentes</div>
          )}
        </div>
      </div>
    </div>
  )
}