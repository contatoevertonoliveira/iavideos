import React from 'react'
import { api } from '@/lib/api'
import PerformanceAlertCard from './components/PerformanceAlertCard'
import QuotaBar from './components/QuotaBar'

export default function AlertCenter() {
  const [tab, setTab] = React.useState<'performance'|'quota'|'tokens'>('performance')
  const [perf, setPerf] = React.useState<{ alerts: { type: string; message: string; severity: string; delta?: number }[] } | null>(null)
  const [quota, setQuota] = React.useState<{ provider: string; remaining: number; quota_max: number; reset_at: string } | null>(null)
  React.useEffect(() => {
    if (tab === 'performance') {
      api.get('/alerts/performance').then((r) => setPerf(r.data)).catch(() => setPerf({ alerts: [] }))
    } else if (tab === 'quota') {
      api.get('/alerts/quota', { params: { provider: 'youtube' } }).then((r) => setQuota(r.data)).catch(() => setQuota(null))
    }
  }, [tab])
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Alertas</h1>
        <div className="flex gap-2">
          <button className={`px-3 py-1.5 text-sm rounded-md ${tab==='performance'?'bg-white/20':'bg-white/10'} text-white`} onClick={() => setTab('performance')}>Performance</button>
          <button className={`px-3 py-1.5 text-sm rounded-md ${tab==='quota'?'bg-white/20':'bg-white/10'} text-white`} onClick={() => setTab('quota')}>Quota</button>
          <button className={`px-3 py-1.5 text-sm rounded-md ${tab==='tokens'?'bg-white/20':'bg-white/10'} text-white`} onClick={() => setTab('tokens')}>Tokens</button>
        </div>
      </div>
      {tab === 'performance' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(perf?.alerts ?? []).length === 0 ? (
            <div className="text-white/60 text-sm">Sem alertas de performance.</div>
          ) : (
            perf?.alerts?.map((a, i) => <PerformanceAlertCard key={i} alert={a} />)
          )}
        </div>
      )}
      {tab === 'quota' && quota && (
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-white/80 text-sm mb-2">{quota.provider.toUpperCase()} API</div>
          <QuotaBar remaining={quota.remaining} quota_max={quota.quota_max} />
          <div className="mt-2 text-xs text-white/60">Reseta em {new Date(quota.reset_at).toLocaleString()}</div>
        </div>
      )}
      {tab === 'tokens' && (
        <div className="rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="text-sm text-white/80">Tokens expirando</div>
          <div className="mt-2 text-xs text-white/60">Use a página de Contas para reautorizar.</div>
        </div>
      )}
    </div>
  )
}