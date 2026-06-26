import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/features/auth/store'

export default function AdminSecretLogin() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore.getState()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const resp = await api.post('/auth/login', null, { params: { email, password } })
      const data = resp.data
      setTokens({ access: data.access_token, refresh: data.refresh_token })
      setUser({
        name: data.user?.name ?? null,
        email: data.user?.email ?? null,
        picture: data.user?.picture ?? null,
        role: (data.user?.role ?? 'user') as any,
      })
      const role = (data.user?.role ?? 'user') as 'superAdmin' | 'moderator' | 'user' | 'viewer'
      if (role === 'superAdmin') {
        navigate('/admin', { replace: true })
      } else {
        setError('Conta válida, porém não é admin. Acesso negado.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Falha no login'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg border border-white/10 bg-white/5 p-6 text-white">
        <h1 className="text-xl font-semibold mb-4">Acesso Administrativo</h1>
        <p className="text-sm text-white/70 mb-4">Rota restrita. Informe seu e-mail e senha.</p>
        {error ? (
          <div className="mb-3 text-red-300 text-sm">{error}</div>
        ) : null}
        <label className="block mb-2 text-sm">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded bg-transparent border border-white/20 px-3 py-2 text-white placeholder:text-white/50"
          placeholder="admin@exemplo.com"
          required
          autoComplete="username"
        />
        <label className="block mb-2 text-sm">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded bg-transparent border border-white/20 px-3 py-2 text-white placeholder:text-white/50"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-2 font-medium"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        <div className="mt-4 text-xs text-white/50">
          Dica: esta rota não aparece no menu e não deve ser divulgada.
        </div>
      </form>
    </div>
  )
}