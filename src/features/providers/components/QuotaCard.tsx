import { useMemo } from 'react'
import { useProviders } from '../hooks/useProviders'

type Props = { providerId: number }

export default function QuotaCard({ providerId }: Props) {
  const { quotaQ } = useProviders()
  const prov = useMemo(() => quotaQ.data?.providers?.find(p => String(p.id) === String(providerId)), [quotaQ.data, providerId])
  const used = prov?.quota?.used ?? null
  const remaining = prov?.quota?.remaining ?? null
  const reset = prov?.quota?.reset ?? null
  const total = typeof used === 'number' && typeof remaining === 'number' ? used + remaining : null
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : null

  return (
    <div className="border rounded p-3">
      <h3 className="font-medium mb-2">Quota</h3>
      <div className="space-y-1 text-sm">
        <div>Usado: {used ?? '—'}</div>
        <div>Restante: {remaining ?? '—'}</div>
        <div>Reset: {reset ?? '—'}</div>
      </div>
      <div className="mt-2 h-2 bg-gray-200 rounded">
        {pct !== null && <div className="h-2 bg-indigo-500 rounded" style={{ width: pct + '%' }} />}
      </div>
      <p className="text-xs text-gray-500 mt-2">Atualiza a cada 5 min. ID: {providerId}</p>
    </div>
  )
}