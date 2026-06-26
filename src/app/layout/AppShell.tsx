import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuthStore } from "@/features/auth/store";
import { Search, RefreshCw, Rocket, Film, Settings, BarChart3, Sun, Moon, Calendar as CalendarIcon, Menu, X, Clapperboard, Monitor, Users, SlidersHorizontal, LayoutGrid } from "lucide-react";
import NotificationsBell from '@/features/alerts/NotificationsBell'
import { GoogleConnect } from '@/features/auth/GoogleConnect'
import { toastSuccess, toastError } from '@/lib/toast'
import ThemeToggle from '@/components/ThemeToggle'

const theme = {
  primary: 'text-[var(--cine-primary)]',
  surface: 'bg-cine-surface',
}

type TargetStatus = {
  channel_id: number;
  name: string;
  platform: "youtube" | "instagram" | "tiktok" | string;
  connected: boolean;
};

export function UserBadge() {
  const { user } = useAuthStore();
  const role = useAuthStore((s) => s.ctx?.user?.role || s.user.role)
  const clear = useAuthStore((s) => s.clear)
  const nav = useNavigate()
  const [linked, setLinked] = React.useState<Array<{ id: number; provider: string; display_name?: string }>>([]);
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/accounts");
        const arr = Array.isArray(data) ? data : [];
        setLinked(arr.map((a: any) => ({ id: a.id, provider: a.provider, display_name: a.display_name })));
      } catch (e) {
        // silencioso em dev
      }
    })();
  }, []);
  // Agrega contas por provedor e conta ocorrência
  const providerCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const acc of linked) {
      const prov = String(acc.provider || "").toLowerCase();
      if (!prov) continue;
      map.set(prov, (map.get(prov) || 0) + 1);
    }
    return Array.from(map.entries()); // [provider, count]
  }, [linked]);
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return
      const target = e.target as Node
      if (!menuRef.current.contains(target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onDoc)
    }
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  if (!user?.name) return null;
  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cine-surface border border-cine text-cine h-[70px] w-[255px]"
        onClick={() => setOpen((v) => !v)}
      >
      {user.picture ? (
        <img
          src={user.picture}
          alt={user.name}
          className="h-10 w-10 rounded-full object-cover user-badge-avatar"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
            if (fallback) fallback.style.display = 'flex'
          }}
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-cine-surface-90 flex items-center justify-center text-xs text-cine-muted user-badge-avatar">
          {(user.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U")}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-cine truncate leading-tight">{user.name}</div>
        <div className="text-[10px] text-cine-muted truncate">{String(role || 'Usuário')}</div>
      </div>
      {providerCounts.length > 0 && (
        <div className="flex items-center gap-1 ml-1">
          {providerCounts.map(([prov, count]) => (
            <span key={prov} className="text-[10px] px-1.5 py-0.5 rounded bg-cine-surface-90 text-cine-muted border border-cine">
              {prov}({count})
            </span>
          ))}
        </div>
      )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-cine bg-cine-surface shadow-xl z-50 p-3 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-cine-surface-90 flex items-center justify-center text-sm text-cine-muted">
                {(user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U")}
              </div>
            )}
          </div>
          <div className="mt-3 space-y-2">
            <Link
              to="/perfil"
              className="block px-3 py-2 text-xs text-cine font-bold rounded-md no-underline transition-colors duration-150 hover-cine"
              onClick={() => setOpen(false)}
            >
              Ver Perfil
            </Link>
            <Link
              to="/settings/security"
              className="block px-3 py-2 text-xs text-cine font-bold rounded-md no-underline transition-colors duration-150 hover-cine"
              onClick={() => setOpen(false)}
            >
              Trocar Senha
            </Link>
          </div>
          <hr className="border-cine my-2" />
          <button
            className="w-full rounded-md px-3 py-2 text-xs bg-cine-surface text-red-600 hover-cine border border-cine"
            onClick={() => { setOpen(false); clear(); nav('/login') }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectedAccountBadge() {
  const authUser = useAuthStore((s) => s.user);
  const accountQ = useQuery({
    queryKey: ["connected-account-badge"],
    queryFn: async () => {
      const { data } = await api.get("/publications/targets");
      const targets: TargetStatus[] = Array.isArray(data) ? data : [];
      const connected = targets.filter((t) => t.connected);
      if (!connected.length) return null;
      // Prefer Google/YouTube, then Instagram, then others
      const order = ["youtube", "instagram", "tiktok"] as const;
      const chosen = connected.sort(
        (a, b) => order.indexOf(a.platform as any) - order.indexOf(b.platform as any)
      )[0];
      const credRes = await api.get(`/channels/${chosen.channel_id}/credentials`);
      const meta = (credRes.data?.meta || {}) as Record<string, any>;
      const name = meta.account_name || meta.display_name || chosen.name;
      const email = meta.account_email || "";
      return {
        name,
        email,
        platform: chosen.platform,
        avatar_url: meta.avatar_url || "",
      } as { name: string; email?: string; platform: string; avatar_url?: string } | null;
    },
    staleTime: 60_000,
  });

  const acc = accountQ.data;
  const showUser = Boolean(authUser?.name || authUser?.picture || authUser?.email);
  // Dados provenientes do store (Google), caso disponíveis
  const name = showUser ? (authUser.name || "") : (acc?.name || "");
  const email = showUser ? (authUser.email || "") : (acc?.email || "");
  const avatar = showUser ? (authUser.picture || "") : (acc?.avatar_url || "");
  const platformLabel = "Google";
  if (!name && !avatar && !email && !acc) return null;
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-cine bg-cine-surface text-cine">
      {avatar ? (
        <img src={avatar} alt={name} className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <div className="h-6 w-6 rounded-full bg-cine-surface-90 flex items-center justify-center text-[10px] text-cine-muted">
          {"G"}
        </div>
      )}
      <div className="text-xs text-cine max-w-[14rem] truncate">
        {name}
        {email ? <span className="text-cine-muted"> · {email}</span> : null}
      </div>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cine-surface-90 text-cine-muted border border-cine">
        {platformLabel}
      </span>
    </div>
  );
}

function ApiHealthIndicator() {
  const healthQ = useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      try {
        // Use o endpoint simples de saúde para evitar latências de dependências (DB/Redis)
        const { data } = await api.get("/health");
        return data as { ok?: boolean };
      } catch (e) {
        return { ok: false } as { ok?: boolean };
      }
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const ok = Boolean(healthQ.data?.ok);
  const dot = ok ? "bg-emerald-400" : "bg-red-500";
  const label = ok ? "API online" : "API offline";
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-cine bg-cine-surface text-cine">
      <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
      <span className="text-xs text-cine-muted">{label}</span>
    </div>
  );
}

function Topbar({ onToggleMobile }: { onToggleMobile: () => void }) {
  const [refreshing, setRefreshing] = React.useState(false);
  const isLogged = useAuthStore((s) => Boolean(s.access || s.user?.name || s.user?.email));
  const refreshAnalytics = async () => {
    try {
      setRefreshing(true);
      const resp = await api.post("/analytics/run-now");
      toastSuccess(resp?.data?.message || "Analytics disparado");
    } catch (e) {
      // interceptor já loga
      toastError("Falha ao disparar analytics");
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <div className={cn("sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-cine-surface border-b border-cine", theme.surface)}>
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Mobile menu button */}
        <button className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-cine hover-cine" aria-label="Abrir menu" onClick={onToggleMobile}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cine-muted" />
          <Input placeholder="Buscar canais, jobs, vídeos…" className="pl-10 bg-cine-surface border-cine text-cine placeholder:text-cine-muted h-10" />
        </div>
        <Button variant="secondary" className="hidden sm:inline-flex bg-cine-surface-90 border border-cine text-cine hover-cine" onClick={refreshAnalytics} disabled={refreshing}>
          <RefreshCw className="h-4 w-4 mr-2" /> {refreshing ? "Atualizando…" : "Atualizar analytics"}
        </Button>
        <Link to="/create" className={cn("hidden sm:inline-flex text-cine shadow-cine rounded-md px-3 py-2 items-center gradient-cine")}> 
          <Rocket className="h-4 w-4 mr-2" /> Rotina da manhã
        </Link>
        <div className="hidden xs:flex items-center gap-3 min-w-[255px] h-[70px] justify-end topbar-right topbar-user-area">
          <ApiHealthIndicator />
          <NotificationsBell />
          {isLogged ? (
            <UserBadge />
          ) : (
            <div className="flex items-center gap-2">
              <GoogleConnect mode="signin" label="Entrar" className="px-3 py-1 rounded border border-cine text-cine hover-cine text-xs" />
              <Link to="/configuracoes/contas" className="px-3 py-1 rounded border border-cine text-cine hover-cine text-xs">
                Cadastrar
              </Link>
            </div>
          )}
          <div className="hidden sm:inline-flex">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarUserSection() {
  const access = useAuthStore((s) => s.access)
  const clear = useAuthStore((s) => s.clear)
  const nav = useNavigate()

  return (
    <div className="text-xs">
      {/* Seção de usuário removida conforme solicitado (usuário e perfil) */}
      <hr className="border-cine my-2" />
      {access && (
        <button
          className="w-full px-3 py-2 rounded-md bg-cine-surface text-red-300 hover-cine border border-cine"
          onClick={() => { clear(); nav('/login') }}
        >
          Sair / Deslogar
        </button>
      )}
    </div>
  )
}

export default function AppShell() {
  const role = useAuthStore((s) => s.ctx?.user?.role || s.user.role);
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Seção principal: Séries
  const seriesItems = [
    { icon: Clapperboard, label: "Todas as Séries", to: "/series" },
    { icon: LayoutGrid, label: "Coleções", to: "/collections" },
  ];

  // Seção: Vídeos
  const videoItems = [
    { icon: Monitor, label: "Galeria", to: "/galeria" },
    { icon: Film, label: "Jobs", to: "/jobs" },
    { icon: CalendarIcon, label: "Calendário", to: "/calendar" },
  ];

  // Seção: Contas
  const accountItems = [
    { icon: Users, label: "Contas", to: "/contas" },
  ];

  // Seção: Configurações
  const settingsItems = [
    { icon: SlidersHorizontal, label: "Geral", to: "/settings" },
    { icon: Settings, label: "APIs de IA", to: "/settings/ai" },
    { icon: Settings, label: "Integrações", to: "/settings/integrations" },
    { icon: Settings, label: "Preferências", to: "/settings/preferences" },
    ...(role === 'superAdmin' ? [{ icon: Settings, label: 'Admin', to: '/admin' }] : []),
  ];

  return (
    <div className={cn("min-h-screen bg-cine text-cine")}>
      <div className="grid min-h-screen grid-cols-1 md:[grid-template-columns:16rem_1fr]">
        {/* Sidebar fixa */}
        <aside className={cn("hidden md:flex min-h-screen flex-col w-64 bg-cine-surface border-r border-cine")}>
          <div className="px-5 py-4 flex items-center gap-2">
            {/* logo */}
            <div className="h-8 w-8 rounded-xl gradient-cine shadow-cine" />
            <div className="font-bold tracking-tight">
              AV<span className="text-[var(--cine-primary)]">·IA</span>
            </div>
            <Badge
              variant="secondary"
              className="ml-auto bg-cine-surface-90 border border-cine text-cine-muted"
            >
              DEV
            </Badge>
          </div>

          {/* Sidebar Navigation Sections */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            {/* Seção: Séries */}
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cine-muted">Séries</div>
              {seriesItems.map((it, idx) => (
                <NavLink key={idx} to={it.to} end className={({ isActive }) =>
                  cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm no-underline transition-colors duration-150 hover-cine", "text-cine", isActive && "bg-cine-hover")
                }>
                  <it.icon className="h-4 w-4 opacity-80" />
                  <span>{it.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Seção: Vídeos */}
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cine-muted">Vídeos</div>
              {videoItems.map((it, idx) => (
                <NavLink key={idx} to={it.to} end className={({ isActive }) =>
                  cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm no-underline transition-colors duration-150 hover-cine", "text-cine", isActive && "bg-cine-hover")
                }>
                  <it.icon className="h-4 w-4 opacity-80" />
                  <span>{it.label}</span>
                  {it.label === "Jobs" && (
                    <Badge className="ml-auto bg-[var(--cine-primary)]/20 text-[var(--cine-primary)] border-0">3 pendentes</Badge>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Seção: Contas */}
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cine-muted">Contas</div>
              {accountItems.map((it, idx) => (
                <NavLink key={idx} to={it.to} end className={({ isActive }) =>
                  cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm no-underline transition-colors duration-150 hover-cine", "text-cine", isActive && "bg-cine-hover")
                }>
                  <it.icon className="h-4 w-4 opacity-80" />
                  <span>{it.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Seção: Configurações */}
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cine-muted">Configurações</div>
              {settingsItems.map((it, idx) => (
                <NavLink key={idx} to={it.to} end className={({ isActive }) =>
                  cn("w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm no-underline transition-colors duration-150 hover-cine", "text-cine", isActive && "bg-cine-hover")
                }>
                  <it.icon className="h-4 w-4 opacity-80" />
                  <span>{it.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          <div className="px-3 py-2">
            <SidebarUserSection />
          </div>

          <div className="mt-auto p-4 text-xs text-cine-muted">
            <div>
              Tema: <span className="text-[var(--cine-primary)]">NeuralCineFlow</span>
            </div>
            <div>Build: 0.1.0-preview</div>
          </div>
        </aside>

        {/* Coluna da direita */}
        <div className="flex min-h-screen flex-col">
          <Topbar onToggleMobile={() => setMobileOpen((v) => !v)} />

          {/* Mobile Drawer */}
          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-[80vw] max-w-xs bg-cine-surface border-r border-cine p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg gradient-cine shadow-cine" />
                    <div className="font-bold tracking-tight">
                      AV<span className="text-[var(--cine-primary)]">·IA</span>
                    </div>
                  </div>
                  <button
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-cine hover-cine"
                    aria-label="Fechar"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Mobile: Séries */}
                  <div>
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cine-muted">Séries</div>
                    {seriesItems.map((it, idx) => (
                      <NavLink key={idx} to={it.to} end onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm no-underline transition-colors duration-150 hover-cine", isActive && "bg-cine-hover")}>
                        <it.icon className="h-4 w-4 opacity-80" />
                        <span>{it.label}</span>
                      </NavLink>
                    ))}
                  </div>
                  {/* Mobile: Vídeos */}
                  <div>
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cine-muted">Vídeos</div>
                    {videoItems.map((it, idx) => (
                      <NavLink key={idx} to={it.to} end onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm no-underline transition-colors duration-150 hover-cine", isActive && "bg-cine-hover")}>
                        <it.icon className="h-4 w-4 opacity-80" />
                        <span>{it.label}</span>
                      </NavLink>
                    ))}
                  </div>
                  {/* Mobile: Contas */}
                  <div>
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cine-muted">Contas</div>
                    {accountItems.map((it, idx) => (
                      <NavLink key={idx} to={it.to} end onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm no-underline transition-colors duration-150 hover-cine", isActive && "bg-cine-hover")}>
                        <it.icon className="h-4 w-4 opacity-80" />
                        <span>{it.label}</span>
                      </NavLink>
                    ))}
                  </div>
                  {/* Mobile: Configurações */}
                  <div>
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cine-muted">Configurações</div>
                    {settingsItems.map((it, idx) => (
                      <NavLink key={idx} to={it.to} end onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm no-underline transition-colors duration-150 hover-cine", isActive && "bg-cine-hover")}>
                        <it.icon className="h-4 w-4 opacity-80" />
                        <span>{it.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <SidebarUserSection />
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}