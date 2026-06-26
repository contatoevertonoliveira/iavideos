import { create } from "zustand";
import { api } from "@/lib/api";

export type Provider = "google" | "facebook" | "twitter" | "tiktok" | "youtube" | string;

export interface SocialAccount {
  id: number;
  provider: Provider;
  external_user_id?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  username?: string | null;
  scopes?: string[] | null;
  status: "active" | "revoked" | "expired" | "error" | string;
  expires_at?: string | null;
}

type ActiveByProvider = Record<string, number | null>;

interface LinkedAccountsState {
  accounts: SocialAccount[];
  activeByProvider: ActiveByProvider;
  fetchAccounts: () => Promise<void>;
  link: (provider: Provider) => Promise<void>;
  unlink: (id: number) => Promise<void>;
  refresh: (id: number) => Promise<void>;
  setActive: (provider: Provider, id: number | null) => void;
}

export const useLinkedAccountsStore = create<LinkedAccountsState>((set, get) => ({
  accounts: [],
  activeByProvider: {},

  fetchAccounts: async () => {
    const res = await api.get("/accounts");
    const accounts: SocialAccount[] = res.data || [];
    set({ accounts });
    // Ensure active selections still point to existing active accounts
    const current = get().activeByProvider;
    const next: ActiveByProvider = { ...current };
    for (const [provider, activeId] of Object.entries(current)) {
      if (activeId == null) continue;
      const acc = accounts.find((a) => a.id === activeId);
      if (!acc || acc.status !== "active") {
        next[provider] = null;
      }
    }
    set({ activeByProvider: next });
  },

  link: async (provider: Provider) => {
    if (provider !== "google") {
      throw new Error(`Link for provider ${provider} not implemented`);
    }

    const scopes = [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/youtube.readonly",
    ];

    const isE2E = String((import.meta as any)?.env?.VITE_E2E_MODE || '').toLowerCase() === 'true'

    // Modo E2E: evitar popup GIS e disparar exchange diretamente
    if (isE2E) {
      const ex = await api.post("/accounts/google/exchange", { code: "E2E_CODE" });
      const payload = ex.data || {};
      const sa: SocialAccount = payload?.account || payload;
      await get().fetchAccounts();
      get().setActive("google", sa?.id ?? null);
      return;
    }

    const startGoogleLinkFlow = async (clientId: string) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const google = (window as any).google;
          if (!google?.accounts?.oauth2?.initCodeClient) {
            reject(new Error("Google GIS not available on window.google"));
            return;
          }
          const codeClient = google.accounts.oauth2.initCodeClient({
            client_id: clientId,
            scope: scopes.join(" "),
            prompt: "consent",
            callback: async (response: any) => {
              try {
                const code = response?.code;
                if (!code) throw new Error("No code returned from Google GIS");
                const ex = await api.post("/accounts/google/exchange", { code });
                const payload = ex.data || {};
                const sa: SocialAccount = payload?.account || payload;
                await get().fetchAccounts();
                get().setActive("google", sa?.id ?? null);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            ux_mode: "popup",
            access_type: "offline",
          });
          codeClient.requestCode();
        } catch (err) {
          reject(err);
        }
      });
    };

    // Prefer env client id, fallback to server-provided link config
    const envClientId = (import.meta as any)?.env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
    try {
      if (envClientId) {
        await startGoogleLinkFlow(envClientId);
      } else {
        const { data } = await api.post(`/accounts/${provider}/link`);
        // Backend retorna { gis: { client_id, ... }, oauth_url, provider }
        const clientId = data?.gis?.client_id || data?.google?.client_id || data?.client_id || "";
        if (!clientId) throw new Error("Missing Google client_id for link flow");
        await startGoogleLinkFlow(clientId);
      }
    } catch (err) {
      console.error("Link flow error:", err);
      throw err;
    }
  },

  unlink: async (id: number) => {
    await api.delete(`/accounts/${id}`);
    await get().fetchAccounts();
    const account = get().accounts.find((a) => a.id === id);
    if (account) {
      const provider = account.provider;
      const current = get().activeByProvider;
      if (current[provider] === id) {
        get().setActive(provider, null);
      }
    }
  },

  refresh: async (id: number) => {
    await api.post(`/accounts/${id}/refresh`);
    await get().fetchAccounts();
  },

  setActive: (provider: Provider, id: number | null) => {
    const current = get().activeByProvider;
    set({ activeByProvider: { ...current, [provider]: id } });
  },
}));

export const getActiveAccount = (accounts: SocialAccount[], provider: Provider, activeByProvider: ActiveByProvider) => {
  const activeId = activeByProvider[provider] ?? null;
  if (activeId == null) return null;
  return accounts.find((a) => a.id === activeId) || null;
};