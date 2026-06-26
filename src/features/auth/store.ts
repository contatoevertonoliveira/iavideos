import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Tokens = { access: string | null; refresh: string | null }

export type Role = 'superAdmin' | 'moderator' | 'viewer' | 'user'
export type SiteMode = 'free' | 'subscribers'
export type SubscriptionPlan = 'criador_basico' | 'criador_moderado' | 'criador_avancado'

export interface AppContext {
  user: { id: number; name: string; email: string; role: Role; avatar_url?: string | null } | null
  permissions?: string[]
  subscriptions?: { active_plan?: SubscriptionPlan | null; status?: 'trial' | 'active' | 'canceled' | null }
  site?: { mode: SiteMode }
}

interface AuthState extends Tokens {
  user: {
    name: string | null
    picture: string | null
    email: string | null
    role: Role | null
  }
  connectedAt: string | null
  ctx: AppContext | null
  setTokens: (t: Tokens) => void
  setUser: (u: Partial<AuthState['user']>) => void
  setConnectedAt: (iso: string | null) => void
  setContext: (ctx: AppContext | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: { name: null, picture: null, email: null, role: 'user' },
      connectedAt: null,
      ctx: null,
      setTokens: (t) => set({ access: t.access, refresh: t.refresh }),
      setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),
      setConnectedAt: (iso) => set({ connectedAt: iso }),
      setContext: (ctx) => set({ ctx }),
      clear: () => set({ access: null, refresh: null, user: { name: null, picture: null, email: null, role: 'user' }, connectedAt: null, ctx: null }),
    }),
    { name: 'av-auth' }
  )
)