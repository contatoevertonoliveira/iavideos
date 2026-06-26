import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { ensureContextLoaded } from './context'
import SessionTimeout from './SessionTimeout'

export default function RequireLocalAuth({ children }: { children: React.ReactNode }) {
  const access = useAuthStore((s) => s.access)
  const ctx = useAuthStore((s) => s.ctx)
  const [loading, setLoading] = React.useState(false)
  const loc = useLocation()

  React.useEffect(() => {
    let mounted = true
    async function run() {
      if (access && !ctx) {
        setLoading(true)
        try {
          await ensureContextLoaded()
        } finally {
          if (mounted) setLoading(false)
        }
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [access, ctx])

  if (!access) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">Carregando contexto…</div>
      </div>
    )
  }

  return <>
    {/* Encerra sessão após 20 minutos sem atividade */}
    <SessionTimeout timeoutMs={20 * 60 * 1000} />
    {children}
  </>
}