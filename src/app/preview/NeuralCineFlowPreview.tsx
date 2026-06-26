import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Rocket,
  Gauge,
  Play,
  Film,
  Settings,
  LibraryBig,
  Bot,
  Video,
  Music2,
  Wand2,
  PanelsTopLeft,
  MonitorPlay,
  Send,
  BarChart3,
  TrendingUp,
  Sun,
  Moon,
  RefreshCw,
  Search,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, NavLink } from "react-router-dom";

// --- Theme tokens (Neural Studio x CineFlow) ---
const theme = {
  bg: "bg-[#0E0B1F]",
  surface: "bg-[#16132B]",
  card: "bg-[#1C1835]",
  primary: "text-[#7C3AED]",
  primaryBg: "bg-[#7C3AED]",
  accent: "text-[#06B6D4]",
  accentBg: "bg-[#06B6D4]",
  gradient: "from-[#7C3AED] via-[#8B5CF6] to-[#06B6D4]",
};

// --- Helpers & placeholders ---
const thumbPlaceholder =
  "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1200&auto=format&fit=crop";
const fmtNumber = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

type Channel = {
  id: number;
  name: string;
};

type Job = {
  id: number;
  channel_id: number;
  length: string;
  with_captions: boolean;
  status: string;
  result?: Record<string, any>;
  created_at?: string;
};

// --- Data hooks ---
function useDashboardData() {
  const channelsQ = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data } = await api.get("/channels");
      return data;
    },
  });

  const jobsQ = useQuery<Job[]>({
    queryKey: ["jobs", 24],
    queryFn: async () => {
      const { data } = await api.get("/jobs", { params: { limit: 24 } });
      return data;
    },
  });

  const channelDetailsQ = useQuery<{ channel: Channel; last_metric?: { views_24h?: number } }[]>({
    queryKey: ["channel-details", channelsQ.data?.map((c) => c.id) ?? []],
    enabled: !!channelsQ.data && channelsQ.data.length > 0,
    queryFn: async () => {
      const res = await Promise.all(
        (channelsQ.data ?? []).map((c) => api.get(`/channels/${c.id}/details`))
      );
      return res.map((r) => r.data);
    },
  });

  // Derived metrics
  const channelsCount = channelsQ.data?.length ?? 0;
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const inLast24h = (d?: string) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return false;
    return t >= dayAgo;
  };
  const rendered24h = (jobsQ.data ?? []).filter(
    (j) => j.status === "RENDERED" && inLast24h(j.created_at as any)
  ).length;
  const published24h = (jobsQ.data ?? []).filter(
    (j) => j.status === "PUBLISHED" && inLast24h(j.created_at as any)
  ).length;
  const views24h = (channelDetailsQ.data ?? []).reduce(
    (acc, d) => acc + (d?.last_metric?.views_24h ?? 0),
    0
  );

  const channelNameMap: Record<number, string> = Object.fromEntries(
    (channelsQ.data ?? []).map((c) => [c.id, c.name])
  );

  return {
    channelsQ,
    jobsQ,
    channelDetailsQ,
    channelsCount,
    rendered24h,
    published24h,
    views24h,
    channelNameMap,
  };
}

// --- Components ---
function Sidebar() {
  const items = [
    { icon: Gauge, label: "Dashboard", to: "/dashboard" },
    { icon: Wand2, label: "Criação", to: "/create" },
    { icon: LibraryBig, label: "Assets", to: "/assets" },
    { icon: Film, label: "Jobs", to: "/jobs" },
    { icon: Bot, label: "Provedores", to: "/settings/providers" },
    { icon: Settings, label: "Configurações", to: "/settings" },
    { icon: BarChart3, label: "Monitoring", to: "/monitoring" },
  ];
  return (
    <aside className={cn("hidden md:flex flex-col w-64 border-r border-white/10", theme.surface)}>
      <div className="px-5 py-4 flex items-center gap-2">
        <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-r", theme.gradient)} />
        <div className="font-bold tracking-tight text-white">AV<span className={cn(theme.primary)}>·IA</span></div>
        <Badge variant="secondary" className="ml-auto bg-white/10 text-white/80">DEV</Badge>
      </div>
      <nav className="px-3 py-2 space-y-1">
        {items.map((it, idx) => (
          <NavLink
            key={idx}
            to={it.to}
            className={({ isActive }) =>
              cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/80 hover:bg-white/5",
                isActive && "bg-white/10 text-white"
              )
            }
          >
            <it.icon className="h-4 w-4" />
            <span>{it.label}</span>
            {it.label === "Jobs" && (
              <Badge className="ml-auto bg-[#06B6D4]/20 text-[#06B6D4]">3 pendentes</Badge>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4 text-xs text-white/50">
        <div>Tema: <span className={cn(theme.accent)}>NeuralCineFlow</span></div>
        <div>Build: 0.1.0-preview</div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <div className={cn("sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-white/10", theme.surface)}>
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input placeholder="Buscar canais, jobs, vídeos…" className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
        </div>
        <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar analytics
        </Button>
        <Button className="bg-gradient-to-r text-white from-[#7C3AED] to-[#06B6D4] hover:opacity-90">
          <Rocket className="h-4 w-4 mr-2" /> Rotina da manhã
        </Button>
        <Button variant="ghost" className="text-white/70 hover:text-white">
          <Sun className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: any; }) {
  return (
    <Card className={cn("border-white/10", theme.card)}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white/70">{label}</CardTitle>
        <div className={cn("p-2 rounded-lg bg-white/5 text-white")}>{<Icon className="h-4 w-4" />}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-white">{value}</div>
        <div className="mt-2 text-xs text-white/50">Últimas 24h</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    CREATED: "bg-white/10 text-white/80",
    STORY_READY: "bg-[#7C3AED]/20 text-[#C4B5FD]",
    RENDERED: "bg-[#06B6D4]/20 text-[#67E8F9]",
    APPROVED: "bg-amber-500/20 text-amber-200",
    PUBLISHED: "bg-emerald-500/20 text-emerald-200",
  };
  return <Badge className={cn("border-0", map[s] || "bg-white/10 text-white/70")}>{s}</Badge>;
}

function VideoCard({ v }: { v: { id: number; title: string; channel: string; length?: string; status: string; thumb: string } }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Card className={cn("overflow-hidden border-white/10", theme.card)}>
        <div className="relative aspect-[16/9]">
          <img
            src={v.thumb}
            alt="thumb"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = thumbPlaceholder;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute left-2 top-2 flex items-center gap-2">
            <Badge className="bg-black/50 text-white border-0"><Video className="h-3 w-3 mr-1" />{v.length ?? "—"}</Badge>
          </div>
          <Button size="sm" className="absolute bottom-2 left-2 bg-white/10 hover:bg-white/20 text-white">
            <Play className="h-4 w-4 mr-1" /> Preview
          </Button>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge s={v.status} />
            <span className="text-xs text-white/50">{v.channel}</span>
          </div>
          <div className="font-medium text-white line-clamp-1">{v.title}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function VideoGrid({ jobs, channelNameMap }: { jobs: Job[]; channelNameMap: Record<number, string> }) {
  const items = jobs.map((j) => ({
    id: j.id,
    title: (j.result as any)?.title || `Job #${j.id}`,
    channel: channelNameMap[j.channel_id] || `Canal ${j.channel_id}`,
    length: undefined,
    status: j.status,
    thumb: `${api.defaults.baseURL}/jobs/${j.id}/thumb`,
  }));
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((v) => (
        <VideoCard key={v.id} v={v} />
      ))}
    </div>
  );
}

function GradientHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-30", theme.gradient)} />
      <div className={cn("relative p-6 md:p-8", theme.surface)}>
        <div className="flex items-start md:items-center justify-between gap-6 flex-col md:flex-row">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">Automatizador de Vídeos com IA</h1>
            <p className="text-white/70 mt-1 max-w-2xl">
              Crie, edite e publique automaticamente em YouTube, Instagram e TikTok. Roteiros com IA, cenas sincronizadas, consistência de personagens e timeline inteligente.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white/10 text-white border-0">MCP-ready</Badge>
              <Badge className="bg-white/10 text-white border-0">Celery Orchestrated</Badge>
              <Badge className="bg-white/10 text-white border-0">FFmpeg Pipeline</Badge>
            </div>
          </div>
          <div className="min-w-[260px] w-full md:w-auto">
            <div className={cn("rounded-xl p-4", theme.card)}>
              <div className="text-sm text-white/80 mb-2 flex items-center gap-2"><Music2 className="h-4 w-4"/> Render da manhã</div>
              <Progress value={66} className="h-2 bg-white/10" />
              <div className="mt-2 text-xs text-white/60">3/5 canais prontos</div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white"><Play className="h-4 w-4 mr-1"/>Ver fila</Button>
                <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20"><Film className="h-4 w-4 mr-1"/>Criar vídeo</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NeuralCineFlowPreview() {
  const {
    channelsQ,
    jobsQ,
    channelDetailsQ,
    channelsCount,
    rendered24h,
    published24h,
    views24h,
    channelNameMap,
  } = useDashboardData();

  const stats = [
    { label: "Canais", value: channelsCount, icon: PanelsTopLeft },
    { label: "Renderizados (24h)", value: rendered24h, icon: MonitorPlay },
    { label: "Publicados (24h)", value: published24h, icon: Send },
    { label: "Views (24h)", value: fmtNumber(views24h), icon: TrendingUp },
  ];

  const [refreshing, setRefreshing] = React.useState(false);
  const refreshAnalytics = async () => {
    try {
      setRefreshing(true);
      await api.post("/analytics/run-now");
      await channelDetailsQ.refetch();
    } catch (e) {
      // log já é feito no interceptor
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <div className={cn("min-h-screen text-white", theme.bg)}>
      <div className="grid grid-cols-1 md:grid-cols-[256px_1fr]">
        <Sidebar />
        <div>
          <div className={cn("sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-white/10", theme.surface)}>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input placeholder="Buscar canais, jobs, vídeos…" className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={refreshAnalytics} disabled={refreshing}>
                <RefreshCw className="h-4 w-4 mr-2" /> {refreshing ? "Atualizando…" : "Atualizar analytics"}
              </Button>
              <Button className="bg-gradient-to-r text-white from-[#7C3AED] to-[#06B6D4] hover:opacity-90">
                <Rocket className="h-4 w-4 mr-2" /> Rotina da manhã
              </Button>
              <Button variant="ghost" className="text-white/70 hover:text-white">
                <Sun className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <main className="p-4 md:p-6 space-y-6">
            <GradientHeader />
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s, i) => (
                <StatCard key={i} label={s.label} value={s.value} icon={s.icon} />
              ))}
            </section>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white/90">Últimos vídeos por canal</h2>
                <Link to="/jobs" className="text-white/70 hover:text-white inline-flex items-center">Ver todos <ChevronRight className="h-4 w-4 ml-1"/></Link>
              </div>
              <VideoGrid jobs={jobsQ.data ?? []} channelNameMap={channelNameMap} />
            </section>
            <Separator className="bg-white/10" />
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white/90">Novos vídeos (aleatórios)</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20"><Wand2 className="h-4 w-4 mr-1"/>Gerar ideias</Button>
                  <Link to="/create" className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white rounded-md px-3 py-2 inline-flex items-center"><Play className="h-4 w-4 mr-1"/>Novo Short</Link>
                </div>
              </div>
              <VideoGrid jobs={jobsQ.data ?? []} channelNameMap={channelNameMap} />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}