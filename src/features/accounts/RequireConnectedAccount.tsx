import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

function useConnectedAccounts() {
  const [accounts, setAccounts] = React.useState<any[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    let mounted = true
    async function run() {
      setLoading(true)
      try {
        const resp = await api.get('/accounts')
        if (mounted) setAccounts(resp?.data ?? [])
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Erro ao carregar contas')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [])
  return { accounts, loading, error }
}

export default function RequireConnectedAccount({ children }: { children: React.ReactNode }) {
  const { accounts, loading } = useConnectedAccounts()
  const nav = useNavigate()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!loading && accounts && accounts.length === 0) {
      setOpen(true)
    }
  }, [loading, accounts])

  if (open) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
          <h2 className="text-lg font-semibold mb-2">Conecte suas contas para publicar</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Para publicar, conecte ao menos uma conta (YouTube, Instagram, TikTok…).
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => nav('/configuracoes/contas')}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Conectar agora
            </button>
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}