import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import SectionCard from '@/components/ui/SectionCard'
import { toastError, toastSuccess } from '@/lib/toast'
import { Link } from 'react-router-dom'
import { useLinkedAccountsStore } from '@/features/accounts/linkedStore'

type Channel = {
  id: number
  name: string
  platform?: 'youtube' | 'instagram' | 'tiktok' | string
  category?: string | null
  publish_config?: { auto_publish?: boolean; targets?: string[] }
}

export default function Channels() {
  const qc = useQueryClient()
  const { accounts, activeByProvider, setActive, fetchAccounts } = useLinkedAccountsStore()
  const googleAccounts = (accounts || []).filter((a) => String(a.provider) === 'google' && a.status === 'active')
  const activeGoogleId = activeByProvider['google'] ?? null

  useEffect(() => {
    fetchAccounts().catch(() => {})
  }, [fetchAccounts])

  const { data, isLoading, error } = useQuery<Channel[]>({
    queryKey: ['channels', { limit: 50, social_account_id: activeGoogleId }],
    queryFn: async () => (await api.get('/channels', { params: { limit: 50, social_account_id: activeGoogleId || undefined } })).data,
    staleTime: 60_000,
  })

  const updateCategory = useMutation({
    mutationFn: async ({ id, category }: { id: number; category: string }) =>
      (await api.put(`/channels/${id}/category`, { category })).data,
    onSuccess: () => {
      toastSuccess('Categoria atualizada')
      qc.invalidateQueries({ queryKey: ['channels'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao atualizar categoria'),
  })

  const updatePublishConfig = useMutation({
    mutationFn: async ({ id, auto_publish }: { id: number; auto_publish: boolean }) =>
      (await api.put(`/channels/${id}/publish-config`, { auto_publish })).data,
    onSuccess: () => {
      toastSuccess('Configuração de publicação atualizada')
      qc.invalidateQueries({ queryKey: ['channels'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao atualizar publicação'),
  })

  const channels = Array.isArray(data) ? data : []
  if (typeof window === 'undefined') {
    console.log('[Channels] channels length =', channels.length, 'activeGoogleId =', activeGoogleId)
  }
  const ytLinkedQ = useQuery<{ external_id: string; name: string }[]>({
    queryKey: ['accounts', 'youtube-channels', activeGoogleId],
    queryFn: async () => {
      if (!activeGoogleId) return []
      const { data } = await api.get(`/accounts/${activeGoogleId}/youtube/channels`)
      return Array.isArray(data) ? data : []
    },
    enabled: Boolean(activeGoogleId),
    staleTime: 30_000,
  })

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      <SectionCard title="Canais" subtitle="Listagem e gestão de múltiplos canais/contas.">
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor="google-account-select" className="text-sm text-white/70">Conta Google</label>
          <select
            className="form-select form-select-sm bg-white/5 border border-white/10 text-white rounded-3"
            id="google-account-select"
            value={activeGoogleId ?? ''}
            onChange={(e) => setActive('google', e.currentTarget.value ? Number(e.currentTarget.value) : null)}
          >
            <option value="">Selecionar conta…</option>
            {googleAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.display_name || acc.username || acc.external_user_id || `Conta ${acc.id}`}</option>
            ))}
          </select>
          {googleAccounts.length === 0 && (
            <span className="text-xs text-white/60">Nenhuma conta Google conectada. Vá em Configurações → Contas.</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm align-middle w-100 text-white">
            <thead>
              <tr className="text-white/70">
                <th>ID</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Auto-Publish</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-sm text-white/60 py-3">Carregando…</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="text-sm text-red-400 py-3">Falha ao carregar canais</td>
                </tr>
              )}
              {channels.map((ch) => (
                <tr key={ch.id} className="border-t border-white/10">
                  <td>{ch.id}</td>
                  <td className="font-medium">{ch.name}</td>
                  <td>
                    <input
                      defaultValue={ch.category || ''}
                      placeholder="Categoria"
                      className="form-control form-control-sm rounded-3 bg-white/5 border border-white/10 text-white"
                      onBlur={(e) => {
                        const val = e.currentTarget.value.trim()
                        if (val && val !== (ch.category || '')) {
                          updateCategory.mutate({ id: ch.id, category: val })
                        }
                      }}
                    />
                  </td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={`auto-${ch.id}`}
                        defaultChecked={Boolean(ch.publish_config?.auto_publish)}
                        onChange={(e) => updatePublishConfig.mutate({ id: ch.id, auto_publish: e.currentTarget.checked })}
                      />
                    </div>
                  </td>
                  <td className="text-sm">
                    <div className="d-flex gap-2">
                      <Link to={`/channels/${ch.id}`} className="btn btn-outline-light btn-sm rounded-3">Detalhes</Link>
                      <Link to={`/accounts`} className="btn btn-outline-light btn-sm rounded-3">Credenciais</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && channels.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-sm text-white/60 py-3">Nenhum canal cadastrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="YouTube – Meus canais" subtitle="Canais vinculados da conta Google ativa.">
        <div className="overflow-x-auto">
          <table className="table table-sm align-middle w-100 text-white">
            <thead>
              <tr className="text-white/70">
                <th>Nome</th>
                <th>ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ytLinkedQ.isLoading && (
                <>
                  {[0,1,2].map((i) => (
                    <tr key={`skeleton-${i}`} className="border-t border-white/10">
                      <td><div className="animate-pulse h-4 w-40 bg-white/10 rounded" /></td>
                      <td><div className="animate-pulse h-4 w-28 bg-white/10 rounded" /></td>
                      <td><div className="animate-pulse h-4 w-24 bg-white/10 rounded" /></td>
                    </tr>
                  ))}
                </>
              )}
              {(ytLinkedQ.data || []).map((it, idx) => (
                <tr key={it?.external_id || idx} className="border-t border-white/10">
                  <td className="font-medium">{it?.name || '-'}</td>
                  <td>{it?.external_id || '-'}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-green-600/20 text-green-300 text-xs border border-green-600/30">Vinculado</span>
                  </td>
                </tr>
              ))}
              {!ytLinkedQ.isLoading && (ytLinkedQ.data?.length || 0) === 0 && (
                <tr>
                  <td colSpan={4} className="text-sm text-white/60 py-3">Nenhum canal do YouTube encontrado. Conecte sua conta e garanta o escopo youtube.readonly.</td>
                </tr>
              )}
              {!activeGoogleId && (
                <tr>
                  <td colSpan={4} className="text-sm text-white/60 py-3">Selecione uma conta Google para listar os canais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
      </div>
    </div>
  )
}