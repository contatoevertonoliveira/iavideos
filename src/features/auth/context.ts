import { useAuthStore } from './store'
import type { AppContext, SiteMode } from './store'
import { api } from '../../lib/api'

const isMocks = (import.meta as any).env?.VITE_USE_MOCKS === 'true'

export async function loadAppContext(): Promise<AppContext> {
  try {
    // Prefer new unified context endpoint if available
    let me: any
    try {
      me = await api.get('/me/context')
    } catch (_) {
      // Fallback para backend v1 padrão
      me = await api.get('/auth/me')
    }
    const user = me?.data ?? null
    const baseCtx: AppContext = {
      user: user
        ? {
            id: user.id ?? 0,
            name: user.name ?? user.email ?? 'Usuário',
            email: user.email ?? '',
            role: (user.role ?? 'user') as AppContext['user']['role'],
            avatar_url: user.picture ?? user.avatar_url ?? null,
          }
        : null,
      permissions: [],
      subscriptions: { active_plan: null, status: null },
      site: { mode: 'free' },
    }

    // Optionally fetch site settings if available; fallback to 'free'
    try {
      const settings = await api.get('/admin/billing/settings')
      const mode = (settings?.data?.site_mode ?? 'free') as SiteMode
      baseCtx.site = { mode }
    } catch (_) {
      // no billing settings endpoint; keep default
    }

    return baseCtx
  } catch (err) {
    if (isMocks) {
      // Mocked context for local-only flows
      const s = useAuthStore.getState()
      const role = (s.user.role ?? 'user') as AppContext['user']['role']
      return {
        user: {
          id: 1,
          name: s.user.name ?? 'Usuário Local',
          email: s.user.email ?? 'local@example.com',
          role,
          avatar_url: s.user.picture ?? null,
        },
        permissions: [],
        subscriptions: { active_plan: null, status: null },
        site: { mode: 'free' },
      }
    }
    throw err
  }
}

export async function ensureContextLoaded(): Promise<void> {
  const { access, ctx, setContext } = useAuthStore.getState()
  if (!access) return
  if (!ctx) {
    const context = await loadAppContext()
    setContext(context)
  }
}