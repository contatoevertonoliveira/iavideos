import { create } from 'zustand'
import { api } from '@/lib/api'
import { useSSE } from '@/lib/useSSE'
import { useEffect } from 'react'
import { toastError, toastInfo } from '@/lib/toast'

export type Notification = {
  id: number
  type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  created_at: string
  read_at?: string | null
  meta?: Record<string, any>
}

type NotificationState = {
  items: Notification[]
  unread: number
  loading: boolean
  fetchAll: (opts?: { unread_only?: boolean; limit?: number }) => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
  addNotification: (n: Notification) => void
}

export const useNotificationsStore = create<NotificationState>((set, get) => ({
  items: [],
  unread: 0,
  loading: false,
  async fetchAll(opts = {}) {
    set({ loading: true })
    try {
      const { data } = await api.get('/notifications', { params: opts })
      const items: Notification[] = Array.isArray(data) ? data : []
      const unread = items.filter((i) => !i.read_at).length
      set({ items, unread, loading: false })
    } catch (e) {
      set({ loading: false })
    }
  },
  async markRead(id: number) {
    try {
      await api.patch(`/notifications/${id}/read`)
      const items = get().items.map((i) => (i.id === id ? { ...i, read_at: new Date().toISOString() } : i))
      const unread = items.filter((i) => !i.read_at).length
      set({ items, unread })
    } catch (e) {
      // no-op
    }
  },
  async markAllRead() {
    try {
      await api.patch('/notifications/read_all')
      const items = get().items.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() }))
      set({ items, unread: 0 })
    } catch (e) {
      // no-op
    }
  },
  addNotification(n: Notification) {
    const items = [n, ...get().items].slice(0, 200)
    const unread = items.filter((i) => !i.read_at).length
    set({ items, unread })
  },
}))

// Hook utilitário para conectarmos SSE e despacharmos para o store
export function useNotificationsSSE() {
  const addNotification = useNotificationsStore((s) => s.addNotification)
  useEffect(() => {
    // nada aqui; a conexão é feita via useSSE abaixo
  }, [])
  const sseUrl = `${api.defaults.baseURL ?? ''}/sse/stream`
  useSSE({
    url: sseUrl,
    onEvent: (evt: any) => {
      const t = evt?.type
      if (t === 'notification_new' && evt?.notification) {
        addNotification(evt.notification as Notification)
      } else if (t === 'job_failed') {
        const msg = typeof evt?.message === 'string' ? evt.message : 'Job falhou'
        toastError(`Job falhou: ${msg}`)
      } else if (t === 'token_expired') {
        const acc = evt?.account || evt?.provider || 'Conta'
        toastError(`Reautorizar ${acc}`)
        const n: Notification = {
          id: Date.now(),
          type: 'token',
          severity: 'warning',
          title: 'Token expirado',
          message: `Reautorizar ${acc}`,
          created_at: new Date().toISOString(),
        }
        addNotification(n)
      } else if (t === 'quota_warning') {
        toastInfo('Quota próxima do limite')
      } else if (t === 'performance_alert' && evt?.alert) {
        const al = evt.alert
        const n: Notification = {
          id: Date.now(),
          type: 'performance',
          severity: (al.severity ?? 'info') as any,
          title: 'Alerta de performance',
          message: al.message ?? 'Queda de métrica detectada',
          created_at: new Date().toISOString(),
          meta: al,
        }
        addNotification(n)
      }
    },
  })
}