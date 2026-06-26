import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Publication = { id: number; job_id?: number; channel_id?: number; status: string; title?: string }

export default function Publications() {
  const [items, setItems] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await api.get('/publications')
        if (!mounted) return
        setItems(resp.data as Publication[])
      } catch (e: any) {
        setError(e?.response?.data?.detail || e.message)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Publicações</h1>
        <p className="text-sm text-slate-500">Listagem das publicações e seu status atual</p>
      </div>
      {loading && <div className="rounded-lg border border-slate-800 bg-slate-900/40 h-24 animate-pulse" />}
      {error && <div className="text-sm text-red-400">Erro: {error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Job</th>
                <th className="text-left p-3">Canal</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Título</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-slate-800">
                  <td className="p-3">{p.id}</td>
                  <td className="p-3">{p.job_id ?? '—'}</td>
                  <td className="p-3">{p.channel_id ?? '—'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800">{p.status}</span>
                  </td>
                  <td className="p-3">{p.title ?? '—'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={5}>Sem publicações</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  )
}