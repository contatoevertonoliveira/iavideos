import { useEffect, useMemo, useState } from 'react'
import { useProviders } from '../hooks/useProviders'

type Props = { providerId: number }

export default function HealthCard({ providerId }: Props) {
  const { healthQ } = useProviders()
  const prov = useMemo(() => healthQ.data?.providers?.find(p => String(p.id) === String(providerId)), [healthQ.data, providerId])
  const [trend, setTrend] = useState<number[]>([])

  useEffect(() => {
    if (!prov) return
    const lat = prov.latency || {}
    const values = Object.values(lat).map((v: any) => Number(v?.ms) || 0)
    const avg = values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0
    setTrend(t => {
      const next = [...t, Math.round(avg)]
      return next.slice(Math.max(0, next.length - 30))
    })
  }, [prov])

  const status = prov?.status || 'down'
  const badgeClass = status === 'up' ? 'bg-green-100 text-green-700' : status === 'degraded' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'

  const maxY = Math.max(100, ...trend)
  const points = trend.map((y, i) => `${(i/(Math.max(1, trend.length-1)))*100},${100 - (y/maxY)*100}`).join(' ')

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Saúde</h3>
        <span className={`px-2 py-1 rounded text-xs ${badgeClass}`}>{status}</span>
      </div>
      <div className="text-sm mb-2">Latência média (ms) • última coleta: {trend.length ? trend[trend.length-1] : '—'}</div>
      <svg viewBox="0 0 100 100" className="w-full h-16">
        <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={points} />
      </svg>
      <p className="text-xs text-gray-500 mt-2">Atualiza a cada 5 min. ID: {providerId}</p>
    </div>
  )
}