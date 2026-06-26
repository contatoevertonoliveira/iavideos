import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toastError, toastSuccess } from '@/lib/toast'
import { useLinkedAccountsStore } from '@/features/accounts/linkedStore'
import type { SocialAccount } from '@/features/accounts/linkedStore'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Plus, RefreshCw, Link2, Unlink, CheckCircle, XCircle, Youtube, Camera, Music, Globe, ExternalLink, ChevronRight } from 'lucide-react'

function formatDate(iso: string | null) {
  try {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('pt-BR')
  } catch {
    return '—'
  }
}

const providerIcons: Record<string, React.ElementType> = {
  google: Youtube,
  youtube: Youtube,
  instagram: Camera,
  tiktok: Music,
  facebook: Globe,
}

const providerColors: Record<string, string> = {
  google: 'bg-red-500/20 text-red-400 border-red-500/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  tiktok: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

function ProviderIcon({ provider }: { provider: string }) {
  const Icon = providerIcons[provider.toLowerCase()] || Globe
  return <Icon className="h-5 w-5" />
}

export default function AccountsPage() {
  const qc = useQueryClient()
  const { accounts, fetchAccounts, link, unlink, refresh, activeByProvider, setActive } = useLinkedAccountsStore()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedAcc, setSelectedAcc] = useState<SocialAccount | null>(null)
  const [channels, setChannels] = useState<Array<{ id: number; name: string }>>([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [errorChannels, setErrorChannels] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts().catch(() => {})
  }, [fetchAccounts])

  async function openDetails(acc: SocialAccount) {
    setSelectedAcc(acc)
    setDetailsOpen(true)
    if (acc.provider !== 'google') {
      setChannels([])
      setLoadingChannels(false)
      setErrorChannels(null)
      return
    }
    setLoadingChannels(true)
    setErrorChannels(null)
    setChannels([])
    try {
      const r1 = await api.get(`/accounts/${acc.id}/youtube/channels`)
      const arr = Array.isArray(r1.data) ? r1.data : (r1.data?.channels || [])
      if (arr.length) {
        setChannels(arr.map((c: any) => ({ id: Number(c.id || c.channel_id || c.external_id || 0), name: c.name || c.title || c.display_name || 'Sem nome' })))
      } else {
        const r2 = await api.get(`/oauth/youtube/account/channels`, { params: { account_id: acc.id } })
        const arr2 = Array.isArray(r2.data) ? r2.data : (r2.data?.channels || [])
        setChannels(arr2.map((c: any) => ({ id: Number(c.id || c.channel_id || c.external_id || 0), name: c.name || c.title || c.display_name || 'Sem nome' })))
      }
    } catch (e: any) {
      setErrorChannels(e?.response?.data?.detail || e?.message || 'Falha ao carregar canais')
    } finally {
      setLoadingChannels(false)
    }
  }

  async function handleLink(provider: string) {
    setConnecting(provider)
    try {
      await link(provider as any)
      toastSuccess(`Conta ${provider} vinculada`)
      qc.invalidateQueries({ queryKey: ['accounts'] })
    } catch (e: any) {
      toastError(e?.response?.data?.detail || e?.message || `Falha ao conectar ${provider}`)
    } finally {
      setConnecting(null)
    }
  }

  const availableProviders = [
    { id: 'google', label: 'Google / YouTube', description: 'Conecte sua conta Google para gerenciar vídeos e canais do YouTube', icon: Youtube },
    { id: 'instagram', label: 'Instagram', description: 'Conecte sua conta do Instagram para publicar Reels e Stories', icon: Camera },
    { id: 'tiktok', label: 'TikTok', description: 'Conecte sua conta do TikTok para publicar vídeos curtos', icon: Music },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-cine">
        <div className="absolute inset-0 gradient-cine opacity-20" />
        <div className="relative p-6 md:p-8 bg-cine-surface">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-cine">Contas</h1>
            <p className="text-cine-muted mt-1">Gerencie as conexões com suas plataformas de vídeo e redes sociais.</p>
          </div>
        </div>
      </div>

      {/* Accounts Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connected Accounts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-cine">Contas conectadas</h2>

          {(accounts || []).length === 0 ? (
            <div className="rounded-xl border border-cine bg-cine-surface p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-cine-surface border border-cine flex items-center justify-center mx-auto mb-4">
                <Link2 className="h-8 w-8 text-cine-muted" />
              </div>
              <p className="text-sm text-cine-muted">Nenhuma conta conectada ainda.</p>
              <p className="text-xs text-cine-muted mt-1">Conecte uma plataforma ao lado para começar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(accounts || []).map((acc: SocialAccount) => {
                const activeId = activeByProvider[acc.provider] ?? null
                const isActive = activeId === acc.id
                const colorClass = providerColors[acc.provider.toLowerCase()] || 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                const isExpired = acc.status !== 'active'

                return (
                  <div
                    key={acc.id}
                    className={cn(
                      'rounded-xl border bg-cine-surface overflow-hidden transition-all duration-200',
                      isActive ? 'border-[var(--cine-primary)]/40' : 'border-cine'
                    )}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Provider icon */}
                        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center border', colorClass)}>
                          <ProviderIcon provider={acc.provider} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-cine truncate">{acc.display_name || '—'}</span>
                            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border uppercase', colorClass)}>
                              {acc.provider}
                            </span>
                          </div>
                          <div className="text-xs text-cine-muted mt-0.5">
                            {acc.username || acc.email || ''}
                            {acc.expires_at && (
                              <span className="ml-2">Expira: {formatDate(acc.expires_at)}</span>
                            )}
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium',
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isExpired
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-slate-500/20 text-slate-400'
                          )}>
                            {isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {isActive ? 'Ativa' : isExpired ? 'Expirada' : 'Inativa'}
                          </span>
                          <button
                            onClick={() => openDetails(acc)}
                            className="p-2 rounded-lg hover-cine text-cine-muted hover:text-cine transition-colors"
                            title="Ver detalhes"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cine">
                        {isExpired ? (
                          <button
                            onClick={() => handleLink(acc.provider)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          >
                            Reconectar
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await refresh(acc.id)
                                toastSuccess('Token renovado')
                              } catch (e: any) {
                                toastError(e?.response?.data?.detail || 'Falha ao renovar')
                              }
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-cine-hover text-cine hover:bg-cine-hover/80 transition-colors"
                          >
                            <RefreshCw className="h-3 w-3 inline mr-1" />
                            Renovar
                          </button>
                        )}
                        <button
                          onClick={() => setActive(acc.provider, acc.id)}
                          className={cn(
                            'text-xs px-3 py-1.5 rounded-lg transition-colors',
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-cine-hover text-cine hover:bg-cine-hover/80'
                          )}
                        >
                          {isActive ? 'Conta principal' : 'Definir como principal'}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await unlink(acc.id)
                              toastSuccess('Conta desvinculada')
                            } catch (e: any) {
                              toastError(e?.response?.data?.detail || 'Falha ao desvincular')
                            }
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors ml-auto"
                        >
                          <Unlink className="h-3 w-3 inline mr-1" />
                          Desvincular
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Available Platforms to Connect */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-cine">Adicionar plataforma</h2>
          <div className="space-y-3">
            {availableProviders.map((provider) => {
              const alreadyConnected = (accounts || []).some(
                (a) => a.provider.toLowerCase() === provider.id && a.status === 'active'
              )
              return (
                <div
                  key={provider.id}
                  className="rounded-xl border border-cine bg-cine-surface p-4 hover:border-[var(--cine-primary)]/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cine-hover flex items-center justify-center">
                      <provider.icon className="h-5 w-5 text-cine" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-cine">{provider.label}</div>
                      <div className="text-[11px] text-cine-muted line-clamp-1">{provider.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLink(provider.id)}
                    disabled={connecting === provider.id || alreadyConnected}
                    className={cn(
                      'mt-3 w-full text-xs px-3 py-2 rounded-lg font-medium transition-all',
                      alreadyConnected
                        ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                        : connecting === provider.id
                          ? 'bg-cine-hover text-cine-muted cursor-wait'
                          : 'gradient-cine text-white hover:opacity-90'
                    )}
                  >
                    {connecting === provider.id
                      ? 'Conectando...'
                      : alreadyConnected
                        ? 'Conectado'
                        : 'Conectar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailsOpen && selectedAcc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailsOpen(false)}>
          <div className="bg-cine-surface rounded-2xl p-6 w-full max-w-lg shadow-xl border border-cine" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center border', providerColors[selectedAcc.provider.toLowerCase()] || 'bg-blue-500/20 text-blue-400 border-blue-500/30')}>
                  <ProviderIcon provider={selectedAcc.provider} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-cine">{selectedAcc.display_name || selectedAcc.provider}</h3>
                  <p className="text-xs text-cine-muted">{selectedAcc.email || selectedAcc.username || ''}</p>
                </div>
              </div>
              <button className="text-cine-muted hover:text-cine p-1" onClick={() => setDetailsOpen(false)}>
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {selectedAcc.provider === 'google' ? (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-cine mb-3">Canais do YouTube</h4>
                {loadingChannels && (
                  <div className="flex items-center gap-2 text-xs text-cine-muted">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Carregando canais…
                  </div>
                )}
                {errorChannels && (
                  <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-3">{errorChannels}</div>
                )}
                {!loadingChannels && !errorChannels && (
                  <div className="space-y-2">
                    {channels.length === 0 && (
                      <div className="text-xs text-cine-muted">Nenhum canal encontrado.</div>
                    )}
                    {channels.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-cine-hover">
                        <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <Youtube className="h-4 w-4 text-red-400" />
                        </div>
                        <div>
                          <div className="text-sm text-cine">{c.name}</div>
                          <div className="text-[10px] text-cine-muted">ID: {c.id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 text-xs text-cine-muted bg-cine-hover rounded-lg p-4">
                Detalhes adicionais para {selectedAcc.provider} serão exibidos aqui.
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-cine text-cine text-sm hover-cine transition-colors"
                onClick={() => setDetailsOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
