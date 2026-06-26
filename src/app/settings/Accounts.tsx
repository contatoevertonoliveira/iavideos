import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toastError, toastSuccess } from '@/lib/toast'
import { useLinkedAccountsStore } from '@/features/accounts/linkedStore'
import type { SocialAccount } from '@/features/accounts/linkedStore'
import { api } from '@/lib/api'

function formatDate(iso: string | null) {
  try {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return '—'
  }
}

export default function Accounts() {
  const qc = useQueryClient()
  const { accounts, fetchAccounts, link, unlink, refresh, activeByProvider, setActive } = useLinkedAccountsStore()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedAcc, setSelectedAcc] = useState<SocialAccount | null>(null)
  const [channels, setChannels] = useState<Array<{ id: number; name: string }>>([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [errorChannels, setErrorChannels] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts().catch(() => {})
  }, [fetchAccounts])

  async function openDetails(acc: SocialAccount) {
    // Abre a modal para qualquer provedor (como solicitado). Para Google, carrega canais.
    setSelectedAcc(acc)
    setDetailsOpen(true)
    if (acc.provider !== 'google') {
      // Não há canais para outros provedores por enquanto
      setChannels([])
      setLoadingChannels(false)
      setErrorChannels(null)
      return
    }
    setLoadingChannels(true)
    setErrorChannels(null)
    setChannels([])
    try {
      // Tenta endpoint específico por conta
      const r1 = await api.get(`/accounts/${acc.id}/youtube/channels`)
      const arr = Array.isArray(r1.data) ? r1.data : (r1.data?.channels || [])
      if (arr.length) {
        setChannels(arr.map((c: any) => ({ id: Number(c.id || c.channel_id || c.external_id || 0), name: c.name || c.title || c.display_name || 'Sem nome' })))
      } else {
        // Fallback para endpoint genérico da conta autenticada
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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Contas</h2>
      <p className="text-sm text-slate-500">Conexões OAuth e credenciais.</p>

      <div className="mt-4">
        <div className="text-sm font-medium mb-1">Google + YouTube</div>
        <button
          className="px-3 py-1 rounded border border-white/20 text-white text-xs"
          onClick={async () => {
            try {
              await link('google')
              toastSuccess('Conta Google vinculada')
              qc.invalidateQueries({ queryKey: ['accounts'] })
            } catch (e: any) {
              toastError(e?.response?.data?.detail || e?.message || 'Falha ao conectar Google')
            }
          }}
        >
          Conectar Google
        </button>
        <div className="text-xs text-white/60 mt-1">GIS code flow, offline + consent.</div>
      </div>

      {/* Tabela de contas conectadas */}
      <div className="mt-6">
        <div className="text-sm font-medium mb-2">Contas conectadas</div>
        <div className="overflow-x-auto border border-white/10 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-3 py-2">Provedor</th>
                <th className="text-left px-3 py-2">Usuário</th>
                <th className="text-left px-3 py-2">@username</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Expira</th>
                <th className="text-left px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(accounts || []).length === 0 && (
                <tr>
                  <td className="px-3 py-2 text-xs text-white/60" colSpan={6}>Nenhuma conta conectada.</td>
                </tr>
              )}
              {(accounts || []).map((acc: SocialAccount) => {
                const activeId = activeByProvider[acc.provider] ?? null
                const isActive = activeId === acc.id
                return (
                  <tr
                    key={acc.id}
                    className="border-t border-white/10 cursor-pointer hover:bg-white/5"
                    onDoubleClick={() => openDetails(acc)}
                    title={acc.provider === 'google' ? 'Duplo clique para ver canais deste email' : undefined}
                  >
                    <td className="px-3 py-2 align-middle">
                      <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 text-xs border border-blue-600/30 uppercase">{acc.provider}</span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        {acc.avatar_url ? (
                          <img src={acc.avatar_url} alt={acc.display_name || 'Conta'} className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60">
                            {(acc.display_name || 'U').split(' ').map((n) => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate max-w-[12rem]">{acc.display_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">{acc.username || '—'}</td>
                    <td className="px-3 py-2 align-middle">
                      <span className={`px-2 py-0.5 rounded text-xs border ${acc.status === 'active' ? 'bg-green-600/20 text-green-300 border-green-600/30' : 'bg-slate-600/20 text-slate-300 border-slate-600/30'}`}>
                        {isActive ? 'Ativa (selecionada)' : acc.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">{formatDate(acc.expires_at || null)}</td>
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 rounded border border-white/20 text-white text-xs"
                      onClick={async () => {
                        try {
                          await refresh(acc.id)
                          toastSuccess('Token renovado')
                        } catch (e: any) {
                          toastError(e?.response?.data?.detail || 'Falha ao renovar')
                        }
                      }}
                    >
                      Renovar
                    </button>
                    {acc.status !== 'active' && (
                      <button
                        className="px-2 py-1 rounded border border-blue-600/30 text-blue-300 text-xs"
                        onClick={async () => {
                          try {
                            await link(acc.provider as any)
                            toastSuccess('Reconectado com sucesso')
                          } catch (e: any) {
                            toastError(e?.response?.data?.detail || `Falha ao reconectar ${acc.provider}`)
                          }
                        }}
                        title="Iniciar novo fluxo OAuth para reconectar"
                      >
                        Reconectar
                      </button>
                    )}
                    <button
                      className="px-2 py-1 rounded border border-red-600/30 text-red-300 text-xs"
                      onClick={async () => {
                        try {
                          await unlink(acc.id)
                          toastSuccess('Conta desvinculada')
                        } catch (e: any) {
                          toastError(e?.response?.data?.detail || 'Falha ao desvincular')
                        }
                      }}
                    >
                      Desvincular
                    </button>
                    <button
                          className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                          onClick={() => setActive(acc.provider, acc.id)}
                        >
                          {isActive ? 'Ativa' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detailsOpen && selectedAcc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDetailsOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Conta {selectedAcc.provider}</h3>
              <button className="text-slate-600 dark:text-white/70" onClick={() => setDetailsOpen(false)}>✕</button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              {selectedAcc.avatar_url ? (
                <img src={selectedAcc.avatar_url} alt={selectedAcc.display_name || 'Conta'} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60">
                  {(selectedAcc.display_name || 'U').split(' ').map((n) => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-medium">{selectedAcc.display_name || '—'}</div>
                <div className="text-xs text-slate-500 dark:text-white/60">{selectedAcc.username || selectedAcc.email || '—'}</div>
              </div>
            </div>
            {selectedAcc.provider === 'google' ? (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Canais do YouTube</div>
                {loadingChannels && <div className="text-xs text-muted-foreground">Carregando canais…</div>}
                {errorChannels && <div className="text-xs text-red-500">{errorChannels}</div>}
                {!loadingChannels && !errorChannels && (
                  <ul className="space-y-1 text-sm">
                    {channels.length === 0 && (
                      <li className="text-xs text-slate-500 dark:text-white/60">Nenhum canal encontrado.</li>
                    )}
                    {channels.map((c) => (
                      <li key={c.id} className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                        <span className="truncate">{c.name}</span>
                        <span className="ml-auto text-[11px] text-slate-500">#{c.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-500 dark:text-white/60">
                Nenhuma informação adicional disponível para {selectedAcc.provider}.
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700" onClick={() => setDetailsOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}