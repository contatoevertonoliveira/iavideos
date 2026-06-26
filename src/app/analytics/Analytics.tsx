import { useQuery } from '@tanstack/react-query'
import SectionCard from '@/components/ui/SectionCard'
import DonutChart from '@/components/ui/DonutChart'
import BarGradient from '@/components/ui/BarGradient'
import { api } from '@/lib/api'

type Summary = {
  daily_views?: { date: string; value: number }[]
  publications_status?: { name: string; value: number }[]
}

export default function Analytics() {
  const { data } = useQuery<Summary>({
    queryKey: ['analytics-summary'],
    queryFn: async () => (await api.get('/analytics/summary')).data,
    staleTime: 60_000,
  })

  const dailyViews = (data?.daily_views || []).map((d) => ({ name: d.date.slice(5), value: d.value }))
  const pubStatus = (data?.publications_status || [])

  const fallbackDaily = dailyViews.length === 0
    ? Array.from({ length: 7 }).map((_, i) => ({ name: `D${i + 1}`, value: Math.floor(500 + Math.random() * 1500) }))
    : dailyViews

  return (
    <div className="container-fluid">
      <div className="space-y-8">
      <SectionCard title="Média de visualizações diárias">
        <BarGradient data={fallbackDaily} colorFrom="#7C3AED" colorTo="#06B6D4" />
      </SectionCard>
      <SectionCard title="Distribuição de publicações">
        {pubStatus.length > 0 ? <DonutChart data={pubStatus as any} /> : <div className="h-72 rounded-lg border border-slate-800 bg-slate-900/60" />}
      </SectionCard>
    </div>
    </div>
  )
}