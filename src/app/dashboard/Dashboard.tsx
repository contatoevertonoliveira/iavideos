import { Fragment, useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { api } from '@/lib/api'
import StatCard from '@/components/ui/StatCard'
import BarGradient from '@/components/ui/BarGradient'
import DonutChart from '@/components/ui/DonutChart'
import { toastError, toastSuccess } from '@/lib/toast'
import SectionCard from '@/components/ui/SectionCard'

type Channel = { id: number; name: string }
type ChannelDetails = { channel: Channel; last_metric?: { subscribers?: number; views_24h?: number } }
type Job = { id: number; channel_id: number | null; status: string }

export default function Dashboard() {
  const { data: jobsToday } = useQuery({
    queryKey: ['jobs-today'],
    queryFn: async () => (await api.get('/jobs/today')).data,
    staleTime: 60_000,
  })

  const { data: pubs } = useQuery({
    queryKey: ['publications'],
    queryFn: async () => (await api.get('/publications')).data,
    staleTime: 60_000,
  })

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => (await api.get('/analytics/summary')).data,
    staleTime: 60_000,
  })

  const { data: channels } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => (await api.get('/channels')).data,
    staleTime: 60_000,
  })

  const detailsQueries = useQueries({
    queries:
      Array.isArray(channels)
        ? channels.slice(0, 12).map((ch: Channel) => ({
            queryKey: ['channel-details', ch.id],
            queryFn: async () => (await api.get(`/channels/${ch.id}/details`)).data as ChannelDetails,
            staleTime: 60_000,
          }))
        : [],
  })

  const loadingChannels = !channels || detailsQueries.some((q) => q.isLoading)
  const channelDetails: ChannelDetails[] = detailsQueries.map((q) => q.data as ChannelDetails).filter(Boolean)

  const jobsCount = (jobsToday?.length as number) || 0
  const publishedCount = useMemo(() => {
    if (!Array.isArray(pubs)) return 0
    return pubs.filter((p: any) => p.status === 'PUBLISHED').length
  }, [pubs])

  const pubStatusDist = useMemo(() => {
    const counts: Record<string, number> = {}
    if (Array.isArray(pubs)) {
      for (const p of pubs) {
        counts[p.status] = (counts[p.status] || 0) + 1
      }
    }
    return [
      { name: 'PUBLISHED', value: counts['PUBLISHED'] || 0, color: '#10b981' },
      { name: 'FAILED', value: counts['FAILED'] || 0, color: '#ef4444' },
      { name: 'QUEUED', value: counts['QUEUED'] || 0, color: '#f59e0b' },
    ]
  }, [pubs])

  const barData = useMemo(() => {
    // views por canal (24h)
    return channelDetails.map((d) => ({ name: d.channel.name, value: d.last_metric?.views_24h || 0 }))
  }, [channelDetails])

  const subsBarData = useMemo(() => {
    // subs por canal
    return channelDetails.map((d) => ({ name: d.channel.name, value: d.last_metric?.subscribers || 0 }))
  }, [channelDetails])

  const lastPublishedAt = useMemo(() => {
    if (!Array.isArray(pubs)) return null
    const published = pubs
      .filter((p: any) => p.status === 'PUBLISHED' && p.published_at)
      .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    return published[0]?.published_at || null
  }, [pubs])

  function timeAgo(ts?: string | null) {
    if (!ts) return '—'
    const diffMs = Date.now() - new Date(ts).getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 60) return `há ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `há ${diffH} h`
    const diffD = Math.floor(diffH / 24)
    return `há ${diffD} d`
  }

  const dailyViewsData = useMemo(() => {
    // Espera summary.daily_views: [{ date: 'YYYY-MM-DD', value: number }]
    const arr = (summary?.daily_views as any[]) || []
    if (arr.length > 0) {
      return arr.map((d: any) => ({ name: d.date.slice(5), value: d.value || 0 }))
    }
    // Fallback mock (7 dias)
    const today = new Date()
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      const name = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
      return { name, value: Math.floor(500 + Math.random() * 1500) }
    })
  }, [summary])

  const totalSubs = useMemo(() => {
    return channelDetails.reduce((acc, d) => acc + (d.last_metric?.subscribers || 0), 0)
  }, [channelDetails])

  const totalViews24h = useMemo(() => {
    return channelDetails.reduce((acc, d) => acc + (d.last_metric?.views_24h || 0), 0)
  }, [channelDetails])

  const { data: lastRun } = useQuery({
    queryKey: ['analytics-last-run'],
    queryFn: async () => (await api.get('/analytics/last-run')).data,
    staleTime: 60_000,
  })

  async function runMorning() {
    try {
      const resp = await api.post('/jobs/morning-run')
      toastSuccess(resp.data?.started ? 'Rotina da manhã enfileirada' : 'Rotina executada localmente')
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao disparar rotina da manhã')
    }
  }

  return (
    <div className="space-y-8">
      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard title="#Canais" value={channels?.length ?? 0} subtitle="Total" accent="emerald" />
        <StatCard title="Inscritos Totais" value={loadingChannels ? '…' : totalSubs} subtitle="Somatório" accent="violet" />
        <StatCard title="Views 24h" value={loadingChannels ? '…' : totalViews24h} subtitle="Somatório" accent="cyan" />
        <StatCard title="Última postagem" value={timeAgo(lastPublishedAt)} subtitle={lastPublishedAt ? new Date(lastPublishedAt).toLocaleString() : '—'} />
      </div>

      {/* Canais conectados */}
      <SectionCard title="Canais conectados">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.isArray(channels) && channels.map((ch: Channel) => (
            <div key={ch.id} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-950/40 px-3 py-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm truncate">{ch.name}</span>
            </div>
          ))}
          {!channels && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 h-12 animate-pulse" />
          )}
          {Array.isArray(channels) && channels.length === 0 && (
            <div className="text-sm text-slate-500">Nenhum canal cadastrado</div>
          )}
        </div>
      </SectionCard>

      {/* Ações rápidas */}
      <div className="flex gap-3">
        <button className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm border dark:border-slate-700" onClick={runMorning}>
          Rotina da manhã
        </button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Média de visualizações diárias" className="lg:col-span-2">
          <BarGradient data={dailyViewsData} colorFrom="#7C3AED" colorTo="#06B6D4" />
        </SectionCard>
        <SectionCard title="Views por canal (24h)">
          {loadingChannels ? (
            <div className="h-72 rounded-lg border border-slate-800 bg-slate-900/60 animate-pulse" />
          ) : (
            <BarGradient data={barData} />
          )}
        </SectionCard>
        <SectionCard title="Subs por canal">
          {loadingChannels ? (
            <div className="h-72 rounded-lg border border-slate-800 bg-slate-900/60 animate-pulse" />
          ) : (
            <BarGradient data={subsBarData} colorFrom="#7C3AED" colorTo="#06B6D4" />
          )}
        </SectionCard>
      </div>

      {/* Seção: Últimos vídeos por canal */}
      <SectionCard title="Últimos vídeos por canal">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.isArray(channels) && channels.slice(0, 6).map((ch: Channel) => (
            <div key={ch.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div className="font-medium mb-2">{ch.name}</div>
              <ChannelRecentJobs channelId={ch.id} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Seção: Últimos vídeos (grade 4 por linha em telas grandes) */}
      <SectionCard title="Últimos vídeos">
        <MiscRecentJobs fourPerRow />
      </SectionCard>
    </div>
  )
}

function ChannelRecentJobs({ channelId }: { channelId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['jobs', 'channel', channelId],
    queryFn: async () => (await api.get('/jobs', { params: { limit: 100 } })).data as Job[],
    staleTime: 30_000,
  })
  const jobs = (data || []).filter((j) => j.channel_id === channelId && ['RENDERED', 'PUBLISHED'].includes(j.status)).slice(0, 6)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 gap-4">
      {isLoading && (
        <Fragment>
          <div className="aspect-video rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="aspect-video rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="aspect-video rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="aspect-video rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </Fragment>
      )}
      {jobs.map((j) => (
        <JobThumb key={j.id} jobId={j.id} status={j.status} />
      ))}
      {!isLoading && jobs.length === 0 && <div className="text-sm text-slate-500">Sem vídeos recentes</div>}
    </div>
  )
}

function JobThumb({ jobId, status }: { jobId: number; status: string }) {
  const { data } = useQuery({
    queryKey: ['job-assets', jobId],
    queryFn: async () => (await api.get(`/jobs/${jobId}/assets`)).data,
    staleTime: 60_000,
  })
  const thumb = data?.thumb
  return (
    <div className="relative">
      {thumb ? (
        <img
          src={`${api.defaults.baseURL}/jobs/${jobId}/thumb`}
          alt={`thumb-${jobId}`}
          className="aspect-video w-full object-cover rounded"
        />
      ) : (
        <div className="aspect-video rounded bg-slate-200 dark:bg-slate-800" />
      )}
      <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">{status}</span>
    </div>
  )
}

function MiscRecentJobs({ fourPerRow }: { fourPerRow?: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', 'misc'],
    queryFn: async () => (await api.get('/jobs', { params: { limit: 50 } })).data as Job[],
    staleTime: 30_000,
  })
  if (error) {
    toastError('Falha ao carregar jobs')
  }
  const jobs = (data || []).slice(0, 9)
  return (
    <div className={fourPerRow ? 'grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 gap-4' : 'grid grid-cols-3 gap-3'}>
      {isLoading && (
        <Fragment>
          <div className="aspect-video rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="aspect-video rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="aspect-video rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </Fragment>
      )}
      {jobs.map((j) => (
        <JobThumb key={j.id} jobId={j.id} status={j.status} />
      ))}
      {!isLoading && jobs.length === 0 && <div className="text-sm text-slate-500">Sem vídeos recentes</div>}
    </div>
  )
}