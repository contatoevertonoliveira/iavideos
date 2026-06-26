export type AiTask = 'text_gen'|'image_gen'|'tts'|'stt'|'embeddings'|'moderation'|'video_gen'

type CircuitBreaker = { fail_threshold: number; cool_down_ms: number }

export type RoutePref = {
  primary: string[]
  fallback: string[]
  policy: 'lowest_cost'|'lowest_latency'|'highest_quality'|'balanced'
  timeouts_ms?: number
  circuit_breaker?: CircuitBreaker
}

export type ProviderConfig = {
  id: string
  name: string
  baseUrl: string
  headers: Record<string,string>
  endpoints: Record<AiTask,string>
  models: Record<AiTask,string[]>
  activeContexts: string[]
  activeCapabilities: AiTask[]
  health?: { latency_ms?: number; error_rate?: number; last_ok?: string; status:'up'|'degraded'|'down' }
  costHints?: Partial<Record<AiTask, number>>
}

type RuntimeState = {
  fails: Record<string, { count: number; until?: number }>
}

export class AiRouter {
  private state: RuntimeState = { fails: {} }

  constructor(
    private providers: ProviderConfig[],
    private routes: Partial<Record<AiTask, RoutePref>>
  ) {}

  private isBreakerOpen(id: string, pref?: RoutePref): boolean {
    const s = this.state.fails[id]
    if (!s) return false
    const now = Date.now()
    if (s.until && now < s.until) return true
    if (s.until && now >= s.until) {
      delete this.state.fails[id]
      return false
    }
    return false
  }

  recordFailure(id: string, task: AiTask) {
    const pref = this.routes[task]
    if (!pref?.circuit_breaker) return
    const cb = pref.circuit_breaker
    const curr = this.state.fails[id] || { count: 0 }
    curr.count += 1
    if (curr.count >= cb.fail_threshold) {
      curr.until = Date.now() + (cb.cool_down_ms || 30_000)
    }
    this.state.fails[id] = curr
  }

  pick(task: AiTask, context?: string): ProviderConfig | null {
    const pref = this.routes[task]
    const ids = [...(pref?.primary || []), ...(pref?.fallback || [])]
    const candidates = ids
      .map(id => this.providers.find(p => p.id === id))
      .filter((p): p is ProviderConfig => !!p)
      .filter(p => p.activeCapabilities.includes(task))
      .filter(p => !context || p.activeContexts.includes(context))
      .filter(p => p.health?.status !== 'down')
      .filter(p => !this.isBreakerOpen(p.id, pref))

    if (candidates.length === 0) return null

    if (pref?.policy === 'lowest_latency') {
      candidates.sort((a,b) => (a.health?.latency_ms ?? 9999) - (b.health?.latency_ms ?? 9999))
    } else if (pref?.policy === 'lowest_cost') {
      candidates.sort((a,b) => (a.costHints?.[task] ?? 9999) - (b.costHints?.[task] ?? 9999))
    } else if (pref?.policy === 'highest_quality') {
      candidates.sort((a,b) => (b.models[task]?.length ?? 0) - (a.models[task]?.length ?? 0))
    }

    return candidates[0] || null
  }
}