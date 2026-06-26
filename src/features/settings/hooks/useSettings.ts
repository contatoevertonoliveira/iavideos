import { useState, useCallback } from 'react'
import { api } from '@/lib/api'

export type ProviderStatus = 'active' | 'expired' | 'disconnected'

export type IntegrationProvider = {
  provider: string
  status: ProviderStatus
  scopes: string[]
  last_refresh?: string | null
  expires_at?: string | null
}

export type AiSettings = {
  model: string
  temperature: number
  auto_tags: boolean
  auto_schedule: boolean
  auto_repost: boolean
}

export type NotificationsSettings = {
  performance: boolean
  quota: boolean
  tokens: boolean
  ai_suggestions: boolean
  system: boolean
  channels?: { email: boolean; push: boolean }
}

export type PreferencesSettings = {
  language: 'pt-BR' | 'en'
  theme: 'light' | 'dark' | 'auto'
  timezone: string
  dashboard_layout: 'classic' | 'analytical' | 'compact'
}

export type SessionItem = {
  id: string
  device: string
  ip: string
  last_active: string
}

export type LogItem = {
  timestamp: string
  level: 'info' | 'warning' | 'error'
  source: string
  message: string
}

export function useSettings() {
  const [integrations, setIntegrations] = useState<IntegrationProvider[]>([])
  const [ai, setAi] = useState<AiSettings | any>({})
  const [notifications, setNotifications] = useState<NotificationsSettings | any>({})
  const [preferences, setPreferences] = useState<PreferencesSettings | any>({})
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [intg, a, notif, pref] = await Promise.all([
      api.get('/settings/integrations'),
      api.get('/settings/ai'),
      api.get('/settings/notifications'),
      api.get('/settings/preferences'),
    ])
    setIntegrations(intg.data.providers)
    setAi(a.data)
    setNotifications(notif.data.data ?? notif.data)
    setPreferences(pref.data.data ?? pref.data)
    setLoading(false)
  }, [])

  const updateAi = async (data: Partial<AiSettings>) => {
    await api.patch('/settings/ai', data)
    setAi({ ...ai, ...data })
  }
  const updateNotifications = async (d: Partial<NotificationsSettings>) => {
    await api.patch('/settings/notifications', d)
    setNotifications({ ...notifications, ...d })
  }
  const updatePreferences = async (d: Partial<PreferencesSettings>) => {
    await api.patch('/settings/preferences', d)
    setPreferences({ ...preferences, ...d })
    // Persist language to localStorage for simple i18n demo
    if (typeof d.language === 'string') {
      try { localStorage.setItem('app_lang', d.language) } catch {}
    }
  }

  const setIntegrationStatus = (provider: string, status: ProviderStatus) => {
    setIntegrations((prev) => prev.map((p) => (p.provider === provider ? { ...p, status } : p)))
  }

  const reconnect = async (provider: string) => {
    await api.post(`/settings/integrations/${provider}/reconnect`)
    setIntegrationStatus(provider, 'active')
  }
  const revoke = async (provider: string) => {
    await api.delete(`/settings/integrations/${provider}/revoke`)
    setIntegrationStatus(provider, 'disconnected')
  }

  const loadLogs = async () => {
    const { data } = await api.get('/settings/logs?limit=50')
    setLogs(data.logs)
  }
  const exportLogs = async (fmt: 'json' | 'csv') => {
    const url = `${api.defaults.baseURL}/settings/logs/export?format=${fmt}`
    window.open(url, '_blank')
  }

  const loadSessions = async () => {
    const { data } = await api.get('/settings/security/sessions')
    setSessions(data.sessions)
  }
  const revokeSession = async (id: string) => {
    await api.delete(`/settings/security/sessions/${id}`)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  return {
    integrations,
    ai,
    notifications,
    preferences,
    sessions,
    logs,
    loading,
    loadAll,
    updateAi,
    updateNotifications,
    updatePreferences,
    setIntegrationStatus,
    reconnect,
    revoke,
    loadLogs,
    exportLogs,
    loadSessions,
    revokeSession,
  }
}