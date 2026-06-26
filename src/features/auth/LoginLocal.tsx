import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, Smartphone, Github, Youtube, Music } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { api } from '../../lib/api'
import { useAuthStore } from './store'
import { ensureContextLoaded } from './context'

type LoginStep = 'credentials' | 'mfa'
const isMocks = (import.meta as any).env?.VITE_USE_MOCKS === 'true'

export default function LoginLocal() {
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const nav = useNavigate()
  const loc = useLocation()
  const [step, setStep] = React.useState<LoginStep>('credentials')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [mfaToken, setMfaToken] = React.useState('')
  const [mfaSession, setMfaSession] = React.useState<string | null>(null)

  const isValidEmail = (val: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(val)
  const canSubmitCreds = isValidEmail(email) && password.length >= 6 && !loading
  const canSubmitMfa = mfaToken.trim().length >= 6 && !loading && Boolean(mfaSession)

  async function handleLogin() {
    setError(null)
    if (!canSubmitCreds) return
    setLoading(true)
    try {
      if (isMocks) {
        setTokens({ access: 'mock-access', refresh: 'mock-refresh' })
        setUser({ email, name: email.split('@')[0] ?? 'Usuário', role: 'user', picture: null })
        await onLoginSuccess()
      } else {
        const resp = await api.post('/auth/login', null, { params: { email, password, remember } })
        const data = resp.data ?? {}
        const access = data.access ?? data.access_token
        const refresh = data.refresh ?? data.refresh_token
        const user = data.user
        const mfaRequired = data?.mfa_required && data?.mfa_session
        if (mfaRequired) {
          setMfaSession(String(data.mfa_session))
          setStep('mfa')
        } else {
          if (!access) throw new Error('Credenciais inválidas')
          setTokens({ access, refresh })
          if (user) {
            setUser({ email: user.email ?? email, name: user.name ?? user.email ?? email, role: user.role ?? 'user', picture: user.picture ?? null })
          } else {
            setUser({ email, name: email, role: 'user', picture: null })
          }
          await onLoginSuccess()
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  async function handleMfaVerify() {
    setError(null)
    if (!canSubmitMfa) return
    setLoading(true)
    try {
      // Caso exista endpoint de MFA, ajustar aqui. Placeholder:
      const resp = await api.post('/auth/mfa/verify', { mfa_session: mfaSession, code: mfaToken })
      const data = resp.data ?? {}
      const access = data.access ?? data.access_token
      const refresh = data.refresh ?? data.refresh_token
      const user = data.user
      if (!access) throw new Error('Falha na verificação 2FA')
      setTokens({ access, refresh })
      if (user) {
        setUser({ email: user.email ?? email, name: user.name ?? user.email ?? email, role: user.role ?? 'user', picture: user.picture ?? null })
      }
      await onLoginSuccess()
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? 'Código inválido. Tente novamente.')
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
    <div className="min-h-screen grid md:grid-cols-2 bg-cine text-cine">
      {/* Lado esquerdo — herói/branding */}
      <div className="hidden md:flex relative overflow-hidden">
        <div className="absolute inset-0 gradient-cine opacity-60" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(60rem 30rem at 20% 20%, rgba(255,255,255,.08), transparent 40%), radial-gradient(40rem 20rem at 80% 60%, rgba(0,184,255,.10), transparent 50%)' }} />
        <div className="relative z-10 w-full p-10 flex flex-col justify-between">
          <div>
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--cine-surface)]/70 border border-cine shadow-cine">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm">Segurança de nível profissional</span>
            </div>
            <h1 className="neural-heading text-4xl font-semibold mt-6 leading-tight">
              Bem-vindo ao <span className="text-transparent bg-clip-text gradient-cine">NeuralCineFlow</span>
            </h1>
            <p className="text-cine-muted mt-3 max-w-lg">Crie vídeos, imagens e músicas com IA em um fluxo cinematográfico, elegante e seguro.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-10">
            <Feature label="YouTube" icon={<Youtube className="w-5 h-5" />} />
            <Feature label="TikTok" icon={<Music className="w-5 h-5" />} />
            <Feature label="GitHub" icon={<Github className="w-5 h-5" />} />
          </div>
        </div>
      </div>

      {/* Lado direito — card de login */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
          <Card className="neural-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Entrar</h2>
                  <p className="text-cine-muted text-sm mt-1">Acesse sua conta para continuar</p>
                </div>
                <LogoMini />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {error && (
                <div className="rounded-lg border border-red-300/40 bg-red-50/60 dark:bg-red-500/10 text-red-700 dark:text-red-200 px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              {step === 'credentials' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-70" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="voce@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 bg-cine-surface border-cine focus-visible:ring-cine-primary"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <a href="/auth/forgot" className="text-sm hover:underline">Esqueceu a senha?</a>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-70" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10 bg-cine-surface border-cine focus-visible:ring-cine-primary"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-cine hover:opacity-80"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      Permanecer conectado
                    </label>
                  </div>

                  <Button
                    className="w-full gradient-cine text-white rounded-cine shadow-cine"
                    onClick={handleLogin}
                    disabled={!canSubmitCreds}
                  >
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando…</> : 'Entrar'}
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-cine" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-cine px-2 text-cine-muted">ou</span></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <SSOButton label="YouTube" href="/api/auth/sso/google" icon={<Youtube className="w-4 h-4" />} />
                    <SSOButton label="TikTok" href="/api/auth/sso/tiktok" icon={<Music className="w-4 h-4" />} />
                    <SSOButton label="GitHub" href="/api/auth/sso/github" icon={<Github className="w-4 h-4" />} />
                  </div>
                </>
              )}

              {step === 'mfa' && (
                <>
                  <div className="rounded-lg border border-cine p-3 bg-cine-surface">
                    <div className="flex items-center gap-2 text-sm"><Smartphone className="w-4 h-4" />
                      <b>Verificação em duas etapas</b>
                    </div>
                    <p className="text-sm text-cine-muted mt-1">Insira o código do seu app autenticador ou SMS.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="mfa">Código 2FA</Label>
                    <Input id="mfa" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="000000" value={mfaToken} onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0,6))} className="bg-cine-surface border-cine focus-visible:ring-cine-primary tracking-widest text-center text-lg" />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex-1" onClick={() => setStep('credentials')}>Voltar</Button>
                    <Button className="flex-1 gradient-cine text-white rounded-cine shadow-cine" onClick={handleMfaVerify} disabled={!canSubmitMfa}>
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando…</> : 'Confirmar'}
                    </Button>
                  </div>
                </>
              )}

            </CardContent>
            <CardFooter className="text-center">
              <p className="text-xs text-cine-muted w-full">Protegido por políticas de segurança, detecção de fraude e rate limiting.</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function Feature({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="neural-card p-4 flex items-center gap-3">
      <div className="w-9 h-9 grid place-items-center rounded-full gradient-cine text-white shadow-cine">{icon}</div>
      <div className="text-sm">{label}</div>
    </div>
  )
}

function LogoMini() {
  return (
    <div className="inline-flex items-center gap-2 select-none">
      <div className="w-6 h-6 rounded-full gradient-cine shadow-cine" />
      <span className="text-sm font-semibold">NeuralCineFlow</span>
    </div>
  )
}

function SSOButton({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  return (
    <a href={href} className="neural-card p-2 flex items-center justify-center gap-2 hover:opacity-90">
      {icon}
      <span className="text-sm">{label}</span>
    </a>
  )
}