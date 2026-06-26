import { useEffect } from "react"
import { toastSuccess, toastError } from "@/lib/toast"
import { useAuthStore } from "./store"

type Props = {
  channelId?: number | null
  label?: string
  className?: string
  mode?: 'exchange' | 'signin'
}

export function GoogleConnect({ channelId, label, className, mode = 'exchange' }: Props) {
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1"
    const isE2E = String(import.meta.env.VITE_E2E_MODE || '').toLowerCase() === 'true'

    const doExchange = async (code?: string) => {
      const endpoint = mode === 'signin' ? '/auth/google/signin' : '/auth/google/exchange'
      const url = `${base}${endpoint}${mode === 'exchange' && channelId ? `?channel_id=${channelId}` : ""}`
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      })
        .then(async (r) => {
          const j = await r.json().catch(() => ({}))
          if (!r.ok) {
            console.error("[GoogleConnect] exchange error:", j)
            toastError("Falha ao conectar a conta Google")
            return
          }
          console.log("[GoogleConnect] exchange response:", j)
          toastSuccess(mode === 'signin' ? "Login com Google concluído" : "Conta Google conectada")
          // Guardar tokens e dados básicos do usuário
          try {
            const access = (j?.access_token || j?.credentials?.access_token) as string | null
            const refresh = (j?.refresh_token || j?.credentials?.refresh_token) as string | null
            useAuthStore.getState().setTokens({ access: access || null, refresh: refresh || null })
            useAuthStore.getState().setConnectedAt(new Date().toISOString())
            // Salvar perfil retornado diretamente no exchange (id_token/userinfo)
            if (j?.user) {
              const name = (j.user?.name as string | null) ?? null
              const picture = (j.user?.picture as string | null) ?? null
              const email = (j.user?.email as string | null) ?? null
              // Se for login, incluir role quando retornado
              const role = (j.user?.role as any) ?? undefined
              useAuthStore.getState().setUser({ name, picture, email, role })
            }
            // Somente no modo de exchange (vincular canal) tentar enriquecer via credenciais do canal
            if (mode === 'exchange') {
              const channelIdResp = (j?.channel_id || j?.credentials?.channel_id) as number | undefined
              if (channelIdResp) {
                try {
                  const cr = await fetch(`${base}/channels/${channelIdResp}/credentials`)
                  const cj = await cr.json().catch(() => ({}))
                  const meta = (cj?.meta || {}) as Record<string, any>
                  const name = meta.account_name || meta.display_name || null
                  const picture = meta.account_avatar || meta.avatar_url || null
                  const email = meta.account_email || null
                  useAuthStore.getState().setUser({ name, picture, email })
                } catch (e) {
                  // silencioso
                }
              }
            }
          } catch (e) {
            // silencioso
          }
          const accessToken = (j?.access_token || j?.credentials?.access_token) as string | undefined
          const snippet = accessToken ? accessToken.slice(0, 12) : ""
          // Verificação automática: tokeninfo escopo + YouTube /me
          if (accessToken && mode === 'exchange') {
            try {
              const verifyUrl = `${base}/integrations/google-youtube/verify?access_token=${encodeURIComponent(accessToken)}`
              const vr = await fetch(verifyUrl)
              const vj = await vr.json().catch(() => ({}))
              console.log("[GoogleConnect] verify response:", vj)
              if (!(vr.ok && vj?.ok)) {
                const step = vj?.step || "desconhecido"
                const status = vj?.status || vr.status
                console.warn(`[GoogleConnect] verificação falhou (${step}). Status: ${status}. Token: ${snippet}...`)
              }
            } catch (e) {
              console.error("[GoogleConnect] verify network error:", e)
              // manter apenas toast principal de sucesso
            }
          } else {
            // token indisponível para verificação; já exibimos toast principal
          }
        })
        .catch((e) => {
          console.error("[GoogleConnect] exchange network error:", e)
          toastError("Erro de rede ao conectar a conta Google")
        })
    }

    // Modo E2E: sem GIS, clique dispara diretamente o /exchange
    if (isE2E || !(window as any).google) {
      ;(window as any).googleConnect = () => doExchange("E2E_CODE")
      return
    }

    const client = (window as any).google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/youtube.readonly",
      ].join(" "),
      ux_mode: "popup",
      access_type: "offline",
      prompt: "consent",
      callback: async (resp: any) => {
        if (resp?.error) {
          const err = String(resp.error || '').toLowerCase()
          if (err.includes('access_denied')) {
            toastError('Consentimento negado. Conceda permissões para conectar.')
          } else if (err.includes('popup_closed')) {
            toastError('Popup fechado antes de concluir o consentimento.')
          } else {
            toastError('Falha no consentimento do Google')
          }
          return
        }
        if (resp?.code) {
          console.log("[GoogleConnect] Authorization code:", resp.code)
          await doExchange(resp.code)
        }
      },
    })

    ;(window as any).googleConnect = () => client.requestCode()
  }, [channelId])

  return (
    <button
      onClick={() => (window as any).googleConnect()}
      className={className || "px-3 py-1 rounded border border-white/20 text-white text-xs"}
    >
      {label || "Conectar com Google"}
    </button>
  )
}