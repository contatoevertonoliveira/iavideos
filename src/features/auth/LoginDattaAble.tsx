import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from './store'
import { ensureContextLoaded } from './context'
import { cn } from '@/lib/utils'

export default function LoginDattaAble() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [remember, setRemember] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const isValidEmail = (val: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(val)
  const canSubmitCreds = isValidEmail(email) && password.length >= 6 && !loading

  async function handleLogin(e?: React.MouseEvent | React.FormEvent) {
    if (e) e.preventDefault()
    setError(null)
    if (!canSubmitCreds) return
    setLoading(true)
    try {
      const resp = await api.post('/auth/login', null, { params: { email, password, remember } })
      const data = resp.data ?? {}
      const access = data.access ?? data.access_token
      const refresh = data.refresh ?? data.refresh_token
      const user = data.user
      if (!access) throw new Error('Credenciais inválidas')
      setTokens({ access, refresh })
      if (user) {
        setUser({ email: user.email ?? email, name: user.name ?? user.email ?? email, role: user.role ?? 'user', picture: user.picture ?? null })
      } else {
        setUser({ email, name: email, role: 'user', picture: null })
      }
      await onLoginSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  async function onLoginSuccess() {
    try { await ensureContextLoaded() } catch (_) {}
    const s = useAuthStore.getState()
    const role = s.ctx?.user?.role ?? s.user.role ?? 'user'
    const dest = role === 'superAdmin' ? '/admin' : '/dashboard'
    const from = (loc.state as any)?.from as string | undefined
    nav(from ?? dest, { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-[var(--cine-bg)]">
      {/* Painel de destaque (esquerda) */}
      <div className={cn(
        'hidden lg:flex w-1/2 relative overflow-hidden',
        'bg-gradient-to-br from-[var(--cine-primary)] via-[#8B5CF6] to-[var(--cine-secondary)]'
      )}>
        <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
        <div className="relative z-10 p-12 text-white flex flex-col justify-between w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20" />
              <div className="text-2xl font-bold tracking-tight">AV<span className="text-black/80">·IA</span></div>
            </div>
            <h1 className="mt-10 text-4xl font-semibold leading-tight">NeuralCine Flow</h1>
            <p className="mt-3 text-white/80 max-w-md">Automatize suas criações e publique com estilo. Entre para continuar.</p>
          </div>
          <div className="text-sm text-white/70">Build 0.1.0-preview</div>
        </div>
      </div>

      {/* Formulário de login (direita) */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-cine bg-[var(--cine-surface)] shadow-cine p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--cine-text)]">Entrar</h2>
            <p className="text-[var(--cine-text-muted)] text-sm mt-1">Use suas credenciais para acessar</p>
          </div>
          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 text-red-600 px-3 py-2 text-sm" role="alert">{error}</div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-[var(--cine-text)] mb-1">Email</label>
              <input
                id="email"
                type="email"
                className="w-full rounded-md bg-[var(--cine-hover)] border border-cine text-[var(--cine-text)] placeholder:text-[var(--cine-text-muted)] px-3 py-2 focus:outline-none focus:ring-2 ring-[var(--cine-primary)]"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-[var(--cine-text)] mb-1">Senha</label>
              <input
                id="password"
                type="password"
                className="w-full rounded-md bg-[var(--cine-hover)] border border-cine text-[var(--cine-text)] placeholder:text-[var(--cine-text-muted)] px-3 py-2 focus:outline-none focus:ring-2 ring-[var(--cine-primary)]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[var(--cine-text)]">
                <input
                  className="rounded border-cine"
                  type="checkbox"
                  id="rememberCheck"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Permanecer conectado
              </label>
              <Link to="/auth/forgot" className="text-sm text-[var(--cine-primary)] no-underline hover:opacity-80">Recuperar senha</Link>
            </div>
            <button
              type="submit"
              className="w-full rounded-cine px-4 py-2 shadow-card bg-[var(--cine-primary)] text-white hover:opacity-90 disabled:opacity-60"
              disabled={!canSubmitCreds}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
          <div className="mt-6 text-sm">
            <span className="text-[var(--cine-text-muted)]">Não tem conta? </span>
            <Link to="/register" className="text-[var(--cine-primary)] no-underline hover:opacity-80">Registrar</Link>
          </div>
        </div>
      </div>
    </div>
  )
}