import React from 'react'
import { useAuthStore } from '@/features/auth/store'
import { api } from '@/lib/api'
import SectionCard from '@/components/ui/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toastError, toastSuccess } from '@/lib/toast'
import { Link } from 'react-router-dom'

type SocialAccount = { id: number; provider: string; display_name?: string; username?: string; avatar_url?: string; email?: string }

export default function UserProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [name, setName] = React.useState(user.name || '')
  const [email] = React.useState(user.email || '')
  const [phone, setPhone] = React.useState<string>('')
  const [address, setAddress] = React.useState<string>('')
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(user.picture || null)
  const [accounts, setAccounts] = React.useState<SocialAccount[]>([])
  const [saving, setSaving] = React.useState(false)
  const [avatarSaving, setAvatarSaving] = React.useState(false)
  const [avatarTempFile, setAvatarTempFile] = React.useState<File | null>(null)
  const [avatarTempUrl, setAvatarTempUrl] = React.useState<string | null>(null)
  const [originalAvatarUrl, setOriginalAvatarUrl] = React.useState<string | null>(user.picture || null)
  const PENDING_AVATAR_KEY = 'pending_avatar_media_id'

  // Helper: carregar avatar (asset) como blob autenticado e gerar URL local
  const loadAvatarBlobUrl = React.useCallback(async (assetId: number): Promise<string | null> => {
    try {
      const resp = await api.get(`/media/${assetId}/file`, { responseType: 'blob', timeout: 30000 })
      const blobUrl = URL.createObjectURL(resp.data)
      return blobUrl
    } catch (e) {
      return null
    }
  }, [])

  // Carregar perfil do backend
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/me/profile')
        setPhone(data?.phone || '')
        setAddress(data?.address || '')
        const assetId = data?.avatar_media_asset_id
        const url = data?.avatar_url
        // Se houver um upload pendente antes do vínculo, tentar reidratar a prévia
        try {
          const pendingIdRaw = localStorage.getItem(PENDING_AVATAR_KEY)
          const pendingId = pendingIdRaw ? Number(pendingIdRaw) : null
          if (pendingId && (!assetId || pendingId !== assetId)) {
            const blobUrl = await loadAvatarBlobUrl(pendingId)
            if (blobUrl) {
              setAvatarPreview(blobUrl)
              setUser({ picture: blobUrl })
              setOriginalAvatarUrl(blobUrl)
            }
          }
        } catch {}
        if (assetId) {
          const blobUrl = await loadAvatarBlobUrl(assetId)
          if (blobUrl) {
            setAvatarPreview(blobUrl)
            setUser({ picture: blobUrl })
            setOriginalAvatarUrl(blobUrl)
          }
        } else if (url) {
          setAvatarPreview(url)
          setUser({ picture: url })
          setOriginalAvatarUrl(url)
        }
      } catch {}
    })()
  }, [])

  // Listar contas externas vinculadas
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/accounts')
        setAccounts(Array.isArray(data) ? data : [])
      } catch (e) {
        // silencioso em dev
      }
    })()
  }, [])

  // Helpers de UI: mapeamento de cores para provedores e funções
  const providerColorClass = React.useCallback((providerRaw: string) => {
    const provider = (providerRaw || '').toUpperCase()
    const map: Record<string, string> = {
      GOOGLE: 'bg-lime-600/20 text-lime-200 border border-lime-500/30', // chartreuse ≈ lime
      TIKTOK: 'bg-red-600/20 text-red-200 border border-red-500/30',
      INSTAGRAM: 'bg-fuchsia-600/20 text-fuchsia-200 border border-fuchsia-500/30', // magenta ≈ fuchsia
      FACEBOOK: 'bg-blue-600/20 text-blue-200 border border-blue-500/30',
      X: 'bg-gray-600/20 text-gray-200 border border-gray-500/30',
    }
    return map[provider] || 'bg-white/10 text-white/80 border border-white/10'
  }, [])

  const groupedAccounts = React.useMemo(() => {
    const by: Record<string, string[]> = {}
    accounts.forEach((a) => {
      const key = (a.provider || '').toUpperCase()
      const emailOrUser = a.email || a.username || a.display_name
      if (!key) return
      if (!by[key]) by[key] = []
      if (emailOrUser) by[key].push(emailOrUser)
    })
    return by
  }, [accounts])

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setAvatarTempFile(file)
    setAvatarTempUrl(objectUrl)
    setAvatarPreview(objectUrl)
    setUser({ picture: objectUrl })
  }

  async function confirmAvatarChange() {
    if (!avatarTempFile) return
    // Liberar botões imediatamente, manter preview atual (blob) até termos asset
    setAvatarSaving(false)
    toastSuccess('Enviando foto…')
    const fd = new FormData()
    fd.append('file', avatarTempFile)
    api
      .post('/media/upload', fd, { timeout: 120000 })
      .then(async (upload) => {
        const mediaId = upload?.data?.media_asset_id
        if (!mediaId) throw new Error('Upload não retornou media_asset_id')
        // Persistir mediaId pendente para reidratar após refresh
        try { localStorage.setItem(PENDING_AVATAR_KEY, String(mediaId)) } catch {}
        // Atualizar preview com blob do asset recém-criado
        const blobUrl = await loadAvatarBlobUrl(mediaId)
        if (blobUrl) {
          setAvatarPreview(blobUrl)
          setUser({ picture: blobUrl })
          setOriginalAvatarUrl(blobUrl)
          // revogar tempUrl após substituir preview
          if (avatarTempUrl) URL.revokeObjectURL(avatarTempUrl)
          setAvatarTempFile(null)
          setAvatarTempUrl(null)
        }
        // Vínculo e refetch em background
        return api
          .post('/users/me/profile/avatar', { media_asset_id: mediaId }, { timeout: 20000 })
          .then(() => api.get('/users/me/profile'))
          .then(async ({ data: profile }) => {
            const assetId = profile?.avatar_media_asset_id
            const url = profile?.avatar_url
            if (assetId) {
              const fresh = await loadAvatarBlobUrl(assetId)
              if (fresh) {
                setAvatarPreview(fresh)
                setUser({ picture: fresh })
                setOriginalAvatarUrl(fresh)
              }
            } else if (url) {
              setAvatarPreview(url)
              setUser({ picture: url })
              setOriginalAvatarUrl(url)
            }
            try { localStorage.removeItem(PENDING_AVATAR_KEY) } catch {}
            toastSuccess('Foto vinculada ao perfil')
          })
      })
      .catch((e: any) => {
        const msg = e?.response?.data?.detail || e?.message || 'Falha ao enviar/vincular avatar'
        toastError(msg)
      })
  }

  function cancelAvatarChange() {
    if (avatarTempUrl) URL.revokeObjectURL(avatarTempUrl)
    setAvatarTempFile(null)
    setAvatarTempUrl(null)
    setAvatarPreview(originalAvatarUrl)
    setUser({ picture: originalAvatarUrl || undefined })
  }

  // Máscara de telefone brasileiro
  function formatPhoneMask(value: string) {
    const digits = (value || '').replace(/\D/g, '')
    if (digits.length <= 10) {
      // (xx) xxxx-xxxx
      const d = digits.padEnd(10, ' ')
      return `(${d.slice(0,2).trim()}) ${d.slice(2,6).trim()}-${d.slice(6,10).trim()}`.replace(/-\s*$/, '').replace(/\s+/g, ' ')
    }
    // (xx) xxxxx-xxxx
    const d = digits.padEnd(11, ' ')
    return `(${d.slice(0,2).trim()}) ${d.slice(2,7).trim()}-${d.slice(7,11).trim()}`.replace(/-\s*$/, '').replace(/\s+/g, ' ')
  }

  const phoneDigitsOnly = React.useMemo(() => (phone || '').replace(/\D/g, ''), [phone])

  async function onSaveProfile() {
    setSaving(true)
    try {
      // PATCH /users/me exige string JSON crua
      await api.patch('/users/me', JSON.stringify(name), { headers: { 'Content-Type': 'application/json' } })
      await api.patch('/users/me/profile', { phone: phoneDigitsOnly, address })
      setUser({ name })
      toastSuccess('Perfil atualizado e salvo no banco')
    } catch (e) {
      const msg = (e as any)?.response?.data?.detail || 'Não foi possível salvar o perfil'
      toastError(Array.isArray(msg) ? msg[0]?.msg || 'Erro de validação' : msg)
    } finally {
      setSaving(false)
    }
  }

  function PasswordSection() {
    const [current, setCurrent] = React.useState('')
    const [newPwd, setNewPwd] = React.useState('')
    const [confirm, setConfirm] = React.useState('')
    const [working, setWorking] = React.useState(false)
    async function changePassword() {
      if (!newPwd || newPwd !== confirm) {
        toastError('As senhas não coincidem')
        return
      }
      setWorking(true)
      try {
        await api.post('/auth/change-password', { current_password: current, new_password: newPwd })
        toastSuccess('Senha atualizada com sucesso')
        setCurrent('')
        setNewPwd('')
        setConfirm('')
      } catch (e) {
        toastError('Falha ao trocar senha')
      } finally {
        setWorking(false)
      }
    }
    return (
      <SectionCard title="Segurança">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            changePassword()
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white/70">Senha atual</label>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white/70">Nova senha</label>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="w-full bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white/70">Confirmar nova senha</label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full bg-white/5 border-white/10 text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end">
            <Button type="submit" disabled={working} className="bg-white/10 text-white hover:bg-white/20">
              {working ? 'Processando…' : 'Atualizar senha'}
            </Button>
          </div>
        </form>
      </SectionCard>
    )
  }

  const role = useAuthStore((s) => s.ctx?.user?.role || s.user.role)
  const roleLabel = React.useMemo(() => {
    const map: Record<string, string> = { superAdmin: 'superadmin', admin: 'admin', moderator: 'moderador', viewer: 'viewer', user: 'padrão' }
    return role ? (map[role] || String(role)) : null
  }, [role])
  const roleBadgeClass = React.useMemo(() => {
    const map: Record<string, string> = {
      superadmin: 'bg-purple-600/20 text-purple-200 border border-purple-500/30',
      admin: 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30',
      moderador: 'bg-orange-600/20 text-orange-200 border border-orange-500/30',
      viewer: 'bg-teal-600/20 text-teal-200 border border-teal-500/30', // seafoam ≈ teal
      padrão: 'bg-gray-600/20 text-gray-200 border border-gray-500/30',
    }
    return roleLabel ? (map[roleLabel] || 'bg-gray-600/20 text-gray-200 border border-gray-500/30') : ''
  }, [roleLabel])

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      {/* Cabeçalho e informações principais em grid estilo TailAdmin */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <div className="xl:col-span-1">
          <SectionCard title="Perfil" className="h-full">
            <div className="flex flex-col items-center text-center gap-3">
              {avatarPreview ? (
                <img src={avatarPreview} alt={name || 'avatar'} className="h-40 w-40 rounded-full object-cover" />
              ) : (
                <div className="h-40 w-40 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-3xl">
                  {(name || email || 'U').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col items-center">
                <span className="text-white font-medium text-lg">{name || email}</span>
                {roleLabel && <Badge className={roleBadgeClass}>{roleLabel}</Badge>}
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <span className="px-2 py-1 rounded border border-white/10 bg-white/5">
                  {avatarTempFile ? 'Escolher outra foto…' : 'Escolher nova foto…'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
              </label>
              {avatarTempFile && (
                <div className="flex items-center gap-2">
                  <Button onClick={confirmAvatarChange} disabled={avatarSaving} className="bg-white/10 text-white hover:bg-white/20">
                    {avatarSaving ? 'Salvando…' : 'Salvar foto'}
                  </Button>
                  <Button variant="ghost" onClick={cancelAvatarChange} disabled={avatarSaving} className="text-white/80">
                    Cancelar
                  </Button>
                </div>
              )}
              <div className="text-[11px] text-white/50">Formatos suportados: JPG, PNG. Tamanho recomendado: 512×512.</div>
            </div>
          </SectionCard>
        </div>
        <div className="xl:col-span-2">
          <SectionCard title="Informações" className="h-full">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSaveProfile()
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-white/70">Nome completo</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-white/70">Email</label>
                  <Input value={email} readOnly className="w-full bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-white/70">Telefone</label>
                  <Input value={formatPhoneMask(phone)} onChange={(e) => setPhone(e.target.value)} placeholder="(xx) xxxxx-xxxx" className="w-full bg-white/5 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-white/70">Endereço</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" className="w-full bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div className="mt-6">
                <Button type="submit" onClick={onSaveProfile} disabled={saving} className="bg-white/10 text-white hover:bg-white/20">
                  {saving ? 'Salvando…' : 'Salvar alterações'}
                </Button>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>

      <PasswordSection />

      <SectionCard title="Contas externas conectadas">
        {Object.keys(groupedAccounts).length === 0 ? (
          <div className="text-sm text-white/60">Nenhuma conta conectada.</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedAccounts).map(([provider, emails]) => (
              <div key={provider}>
                <div className="flex flex-wrap gap-2">
                  {emails.map((em, idx) => (
                    <Badge key={`${provider}-${em}-${idx}`} className={`${providerColorClass(provider)} text-[11px] uppercase`}>
                      {provider} - {em}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Link to="/configuracoes/contas" className="px-3 py-1 rounded border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 text-xs">Gerenciar contas</Link>
        </div>
      </SectionCard>
    </div>
    </div>
  )
}