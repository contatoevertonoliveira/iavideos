import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PanelsTopLeft, MonitorPlay, Send, TrendingUp, Music2, Play, Film, ChevronRight, ChevronLeft, Video, Wand2, MoreVertical, Edit, Trash2, UploadCloud, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastError, toastSuccess } from "@/lib/toast";
import { useLinkedAccountsStore } from "@/features/accounts/linkedStore";
import WidgetAlertsSummary from '@/features/alerts/components/WidgetAlertsSummary'
import SectionCard from '@/components/ui/SectionCard'

const theme = {
  surface: "bg-cine-surface",
  card: "bg-cine-surface-90 border border-cine",
};

type Channel = { id: number; name: string };
type Job = { id: number; channel_id: number; length?: string; status: string; result?: Record<string, any>; created_at?: string };

function useDashboardData() {
  const channelsQ = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: async () => (await api.get("/channels")).data,
  });
  const jobsQ = useQuery<Job[]>({
    queryKey: ["jobs", 24],
    queryFn: async () => (await api.get("/jobs", { params: { limit: 24 } })).data,
  });
  const detailsQ = useQuery<{ channel: Channel; last_metric?: { views_24h?: number } }[]>({
    queryKey: ["channel-details", channelsQ.data?.map((c) => c.id) ?? []],
    enabled: !!channelsQ.data && channelsQ.data.length > 0,
    queryFn: async () => {
      const res = await Promise.all((channelsQ.data ?? []).map((c) => api.get(`/channels/${c.id}/details`)));
      return res.map((r) => r.data);
    },
  });
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const inLast24h = (d?: string) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    return !Number.isNaN(t) && t >= dayAgo;
  };
  const rendered24h = (jobsQ.data ?? []).filter((j) => j.status === "RENDERED" && inLast24h(j.created_at as any)).length;
  const published24h = (jobsQ.data ?? []).filter((j) => j.status === "PUBLISHED" && inLast24h(j.created_at as any)).length;
  const views24h = (detailsQ.data ?? []).reduce((acc, d) => acc + (d?.last_metric?.views_24h ?? 0), 0);
  const subsTotal = (detailsQ.data ?? []).reduce((acc, d) => acc + (d?.last_metric?.subscribers ?? 0), 0);
  const channelNameMap: Record<number, string> = Object.fromEntries((channelsQ.data ?? []).map((c) => [c.id, c.name]));
  const created24h = (jobsQ.data ?? []).filter((j) => inLast24h(j.created_at as any)).length;
  return { channelsCount: channelsQ.data?.length ?? 0, rendered24h, published24h, views24h, subsTotal, created24h, jobs: jobsQ.data ?? [], channelNameMap };
}

function StatCard({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: any }) {
  return (
    <Card className={cn(theme.card)}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className={cn("text-sm font-medium text-cine-muted")}>{label}</CardTitle>
        <div className="p-2 rounded-cine bg-cine-surface text-cine">{<Icon className="h-4 w-4" />}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-cine">{value}</div>
        <div className={cn("mt-2 text-xs text-cine-muted")}>Últimas 24h</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    CREATED: "bg-[var(--cine-primary)]/10 text-cine",
    STORY_READY: "bg-[var(--cine-secondary)]/20 text-cine",
    RENDERED: "bg-[var(--cine-primary)]/20 text-[var(--cine-primary)]",
    APPROVED: "bg-[var(--cine-positive)]/15 text-cine",
    PUBLISHED: "bg-[var(--cine-positive)]/20 text-[var(--cine-positive)]",
  };
  return <Badge className={cn("border-0", map[s] || "bg-cine-surface-90 text-cine-muted")}>{s}</Badge>;
}

function VideoCard({ v, onPreview, onOpenMenu, menuOpen }: { v: { id: number; title: string; channel: string; length?: string; status: string; thumb: string }; onPreview: (id: number) => void; onOpenMenu: (id: number) => void; menuOpen: boolean }) {
  return (
    <Card className={cn("overflow-hidden", theme.card)}>
      <div className="relative aspect-[16/9]">
        <img src={v.thumb} alt="thumb" className="h-full w-full object-cover cursor-pointer" onClick={() => onPreview(v.id)} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/vite.svg'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-2 top-2 flex items-center gap-2">
          <Badge className="bg-black/50 text-white border-0"><Video className="h-3 w-3 mr-1" />{v.length ?? "—"}</Badge>
        </div>
        <Button size="sm" className="absolute bottom-2 left-2 bg-cine-surface-90 hover-cine text-cine border border-cine" onClick={() => onPreview(v.id)}>
          <Play className="h-4 w-4 mr-1" /> Preview
        </Button>
        <button data-menu="true" className="absolute top-2 right-2 p-2 rounded-md bg-black/40 hover:bg-black/60 text-white" onClick={() => onOpenMenu(v.id)} aria-label="Ações">
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div data-menu="true" className="absolute top-10 right-2 z-40 w-40 rounded-lg border border-cine bg-cine-surface shadow-xl">
            <button data-menu="true" className="w-full text-left px-3 py-2 text-sm text-cine hover-cine inline-flex items-center gap-2" onClick={() => onOpenMenu(-1)}>
              <Edit className="h-4 w-4" /> Editar
            </button>
            <button data-menu="true" className="w-full text-left px-3 py-2 text-sm text-cine hover-cine inline-flex items-center gap-2" onClick={() => onOpenMenu(-4)}>
              <ShieldCheck className="h-4 w-4" /> Aprovar
            </button>
            <button data-menu="true" className="w-full text-left px-3 py-2 text-sm text-cine hover-cine inline-flex items-center gap-2" onClick={() => onOpenMenu(-2)}>
              <UploadCloud className="h-4 w-4" /> Publicar
            </button>
            <button data-menu="true" className="w-full text-left px-3 py-2 text-sm text-cine hover-cine inline-flex items-center gap-2" onClick={() => onOpenMenu(-3)}>
              <Trash2 className="h-4 w-4 text-red-400" /> Excluir
            </button>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge s={v.status} />
          <span className="text-xs text-cine-muted">{v.channel}</span>
        </div>
        <div className="font-medium text-cine line-clamp-1">{v.title}</div>
      </CardContent>
    </Card>
  );
}

function ShortCard({ v, onPreview, onOpenMenu, menuOpen }: { v: { id: number; title: string; channel: string; status: string; thumb: string }; onPreview: (id: number) => void; onOpenMenu: (id: number) => void; menuOpen: boolean }) {
  return (
    <Card className={cn("overflow-hidden border-white/10", theme.card)}>
      <div className="relative aspect-[9/16]">
        <img src={v.thumb} alt="thumb" className="h-full w-full object-cover cursor-pointer" onClick={() => onPreview(v.id)} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/vite.svg'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <button data-menu="true" className="absolute top-2 right-2 p-2 rounded-md bg-black/40 hover:bg-black/60 text-white" onClick={() => onOpenMenu(v.id)} aria-label="Ações">
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div data-menu="true" className="absolute top-10 right-2 z-40 w-40 rounded-lg border border-white/10 bg-[#1C1835] shadow-xl">
            <button data-menu="true" className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/10 inline-flex items-center gap-2" onClick={() => onOpenMenu(-1)}>
              <Edit className="h-4 w-4" /> Editar
            </button>
            <button data-menu="true" className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/10 inline-flex items-center gap-2" onClick={() => onOpenMenu(-4)}>
              <ShieldCheck className="h-4 w-4" /> Aprovar
            </button>
            <button data-menu="true" className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/10 inline-flex items-center gap-2" onClick={() => onOpenMenu(-2)}>
              <UploadCloud className="h-4 w-4" /> Publicar
            </button>
            <button data-menu="true" className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/10 inline-flex items-center gap-2" onClick={() => onOpenMenu(-3)}>
              <Trash2 className="h-4 w-4 text-red-300" /> Excluir
            </button>
          </div>
        )}
        <Button size="sm" className="absolute bottom-2 left-2 bg-white/10 hover:bg-white/20 text-white" onClick={() => onPreview(v.id)}>
          <Play className="h-4 w-4 mr-1" /> Preview
        </Button>
      </div>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge s={v.status} />
          <span className="text-xs text-white/50">{v.channel}</span>
        </div>
        <div className="font-medium text-white text-sm line-clamp-2">{v.title}</div>
      </CardContent>
    </Card>
  );
}

function VideoGrid({ jobs, channelNameMap, onPreview, openMenuId, onOpenMenu }: { jobs: Job[]; channelNameMap: Record<number, string>; onPreview: (id: number) => void; openMenuId: number | null; onOpenMenu: (id: number) => void }) {
  const items = jobs.map((j) => ({
    id: j.id,
    title: (j.result as any)?.title || `Job #${j.id}`,
    channel: channelNameMap[j.channel_id] || `Canal ${j.channel_id}`,
    length: undefined,
    status: j.status,
    thumb: `${api.defaults.baseURL}/jobs/${j.id}/thumb`,
  }));
  return (
    <div className="grid gap-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4">
      {items.map((v) => (
        <VideoCard key={v.id} v={v} onPreview={onPreview} onOpenMenu={onOpenMenu} menuOpen={openMenuId === v.id} />
      ))}
    </div>
  );
}

function ShortsGrid({ jobs, channelNameMap, onPreview, openMenuId, onOpenMenu }: { jobs: Job[]; channelNameMap: Record<number, string>; onPreview: (id: number) => void; openMenuId: number | null; onOpenMenu: (id: number) => void }) {
  const items = jobs
    .filter((j) => String(j.length).toLowerCase() === 'short')
    .map((j) => ({
      id: j.id,
      title: (j.result as any)?.title || `Job #${j.id}`,
      channel: channelNameMap[j.channel_id] || `Canal ${j.channel_id}`,
      status: j.status,
      thumb: `${api.defaults.baseURL}/jobs/${j.id}/thumb`,
    }));
  return (
    <div className="grid gap-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4">
      {items.map((v) => (
        <ShortCard key={v.id} v={v} onPreview={onPreview} onOpenMenu={onOpenMenu} menuOpen={openMenuId === v.id} />
      ))}
    </div>
  );
}

function GradientHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cine">
      <div className="absolute inset-0 gradient-cine opacity-30" />
      <div className={cn("relative p-6 md:p-8", theme.surface)}>
        <div className="flex items-start md:items-center justify-between gap-6 flex-col md:flex-row">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold neural-heading tracking-tight">Automatizador de Vídeos com IA</h1>
            <p className="text-cine-muted mt-1 max-w-2xl">Crie, edite e publique automaticamente em YouTube, Instagram e TikTok.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-cine-surface-90 text-cine border border-cine">MCP-ready</Badge>
              <Badge className="bg-cine-surface-90 text-cine border border-cine">Celery Orchestrated</Badge>
              <Badge className="bg-cine-surface-90 text-cine border border-cine">FFmpeg Pipeline</Badge>
            </div>
          </div>
          <div className="min-w-[260px] w-full md:w-auto">
            <div className={cn("rounded-xl p-4", theme.card)}>
              <div className="text-sm text-cine mb-2 flex items-center gap-2"><Music2 className="h-4 w-4"/> Render da manhã</div>
              <Progress value={66} className="h-2 bg-cine-surface-90" />
              <div className="mt-2 text-xs text-cine-muted">3/5 canais prontos</div>
              <div className="mt-4 flex gap-2">
                <Link to="/jobs" className="gradient-cine text-white rounded-md px-3 py-2 inline-flex items-center text-sm"><Play className="h-4 w-4 mr-1"/>Ver fila</Link>
                <Link to="/create" className="link-cine rounded-md px-3 py-2 inline-flex items-center text-sm border border-cine bg-cine-surface"><Film className="h-4 w-4 mr-1"/>Criar vídeo</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { channelsCount, views24h, subsTotal, created24h, jobs, channelNameMap } = useDashboardData();
  const { accounts, activeByProvider, fetchAccounts } = useLinkedAccountsStore();
  const activeGoogleId = activeByProvider['google'] ?? null;
  useEffect(() => { fetchAccounts().catch(() => {}) }, [fetchAccounts]);
  const stats = [
    { label: "Criações", value: created24h, icon: MonitorPlay },
    { label: "Canais YouTube", value: channelsCount, icon: PanelsTopLeft },
    { label: "Inscritos", value: Math.round(subsTotal).toLocaleString(), icon: Send },
    { label: "Views", value: Math.round(views24h).toLocaleString(), icon: TrendingUp },
  ];
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [publishJobId, setPublishJobId] = useState<number | null>(null);
  const [publishChannelId, setPublishChannelId] = useState<number | null>(null);
  const [ytChannels, setYtChannels] = useState<{ external_id: string; name: string }[]>([]);
  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(null);
  const [loadingYt, setLoadingYt] = useState(false);
  const [latestFilter, setLatestFilter] = useState<'todos'|'aprovados'|'publicados'>('todos');
  const [shortsFilter, setShortsFilter] = useState<'todos'|'aprovados'|'publicados'>('todos');
  const shuffledJobs = useMemo(() => [...jobs].sort(() => Math.random() - 0.5), [jobs]);
  const [randomPage, setRandomPage] = useState(0);
  const [randomInput, setRandomInput] = useState<string>('1');
  const pageSize = 12;
  const maxPage = Math.max(0, Math.ceil(shuffledJobs.length / pageSize) - 1);
  const pagedRandomJobs = useMemo(() => shuffledJobs.slice(randomPage * pageSize, randomPage * pageSize + pageSize), [shuffledJobs, randomPage]);

  function applyStatusFilter(list: Job[], filter: 'todos'|'aprovados'|'publicados') {
    if (filter === 'aprovados') return list.filter((j) => j.status === 'APPROVED');
    if (filter === 'publicados') return list.filter((j) => j.status === 'PUBLISHED');
    return list;
  }

  useEffect(() => {
    const lf = localStorage.getItem('dashboard.latestFilter');
    if (lf === 'todos' || lf === 'aprovados' || lf === 'publicados') setLatestFilter(lf as any);
    const sf = localStorage.getItem('dashboard.shortsFilter');
    if (sf === 'todos' || sf === 'aprovados' || sf === 'publicados') setShortsFilter(sf as any);
    const rp = parseInt(localStorage.getItem('dashboard.randomPage') || '0', 10);
    if (!Number.isNaN(rp)) setRandomPage(Math.max(0, rp));
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard.latestFilter', latestFilter);
  }, [latestFilter]);

  useEffect(() => {
    localStorage.setItem('dashboard.shortsFilter', shortsFilter);
  }, [shortsFilter]);

  useEffect(() => {
    localStorage.setItem('dashboard.randomPage', String(randomPage));
    setRandomInput(String(randomPage + 1));
  }, [randomPage]);

  useEffect(() => {
    setRandomPage((p) => Math.min(p, maxPage));
  }, [maxPage]);

  const approveJob = useMutation({
    mutationFn: async (id: number) => (await api.post(`/jobs/${id}/approve`)).data,
    onSuccess: () => {
      toastSuccess('Job aprovado');
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: any) => {
      toastError(e?.response?.data?.detail || 'Falha ao aprovar job');
    }
  });

  const publishJob = useMutation({
    mutationFn: async (id: number) => (await api.post(`/jobs/${id}/publish`)).data,
    onSuccess: () => {
      toastSuccess('Publicação iniciada');
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        toastError(e?.response?.data?.detail || 'Job não aprovado. Aprove antes de publicar.');
      } else {
        toastError('Falha ao publicar job');
      }
    }
  });

  const bindExternalId = useMutation({
    mutationFn: async (payload: { channelId: number; external_id: string; name?: string }) => (
      await api.put(`/channels/${payload.channelId}/external-id`, { external_id: payload.external_id, name: payload.name })
    ).data,
    onSuccess: () => {
      toastSuccess('Canal vinculado');
      qc.invalidateQueries({ queryKey: ['channels'] });
    },
    onError: (e: any) => {
      toastError(e?.response?.data?.detail || 'Falha ao vincular canal');
    }
  });

  const deleteJob = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/jobs/${id}`)).data,
    onSuccess: () => {
      toastSuccess('Job excluído');
      qc.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: any) => {
      toastError(e?.response?.data?.detail || 'Falha ao excluir job');
    }
  });

  useEffect(() => {
    function handleGlobalMouseDown(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;
      if (!target.closest('[data-menu="true"]')) {
        setOpenMenuId(null);
      }
    }
    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleGlobalMouseDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleGlobalMouseDown);
    };
  }, [openMenuId]);

  function handlePreview(id: number) {
    setPreviewId(id);
  }

  async function openPublishSelector(targetId: number) {
    const j = (jobs ?? []).find((jj) => jj.id === targetId);
    if (!j) return;
    setPublishJobId(targetId);
    setPublishChannelId(j.channel_id);
    setLoadingYt(true);
    try {
      if (!activeGoogleId) {
        toastError('Selecione uma conta Google ativa para listar canais');
        setYtChannels([]);
        setSelectedExternalId(null);
        return;
      }
      const resp = await api.get(`/accounts/${activeGoogleId}/youtube/channels`);
      const arr: { external_id: string; name: string }[] = Array.isArray(resp.data) ? resp.data : (resp.data?.channels || []);
      setYtChannels(arr);
      setSelectedExternalId(arr[0]?.external_id || null);
    } catch (e: any) {
      toastError(e?.response?.data?.detail || 'Falha ao buscar canais do YouTube');
      setYtChannels([]);
      setSelectedExternalId(null);
    } finally {
      setLoadingYt(false);
    }
  }

  async function confirmPublishWithSelection() {
    const jobId = publishJobId;
    const chId = publishChannelId;
    const extId = selectedExternalId;
    setPublishJobId(null);
    setPublishChannelId(null);
    setYtChannels([]);
    if (!jobId || !chId || !extId) {
      toastError('Selecione um canal para publicar');
      return;
    }
    try {
      await bindExternalId.mutateAsync({ channelId: chId, external_id: extId, name: ytChannels.find((c) => c.external_id === extId)?.name });
      const j = (jobs ?? []).find((jj) => jj.id === jobId);
      if (j && j.status !== 'APPROVED') {
        await approveJob.mutateAsync(jobId);
        await api.post(`/jobs/${jobId}/publish`, null, { params: { social_account_id: activeGoogleId || undefined } });
        qc.invalidateQueries({ queryKey: ['jobs'] });
      } else {
        await api.post(`/jobs/${jobId}/publish`, null, { params: { social_account_id: activeGoogleId || undefined } });
        qc.invalidateQueries({ queryKey: ['jobs'] });
      }
    } catch {
      // erros são tratados nas mutations
    }
  }

  function cancelPublishSelection() {
    setPublishJobId(null);
    setPublishChannelId(null);
    setYtChannels([]);
  }

  async function handleMenu(id: number) {
    // id > 0 abre menu para o card; -1 editar; -2 publicar; -3 excluir; -4 aprovar
    if (id > 0) {
      setOpenMenuId((curr) => (curr === id ? null : id));
      return;
    }
    const targetId = openMenuId;
    setOpenMenuId(null);
    if (!targetId) return;
    if (id === -1) {
      navigate(`/jobs/${targetId}`);
    } else if (id === -2) {
      // Abrir seletor de canal para publicação
      await openPublishSelector(targetId);
    } else if (id === -4) {
      approveJob.mutate(targetId);
    } else if (id === -3) {
      setConfirmDeleteId(targetId);
    }
  }
  return (
    <>
      <GradientHeader />
      <section className="space-y-3">
        <WidgetAlertsSummary />
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </section>
      <SectionCard
        title="Últimos vídeos criados"
        subtitle="Grade fixa em 4 colunas no lg; filtro rápido de status"
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-cine overflow-hidden">
              <Button size="sm" variant={latestFilter==='todos' ? 'outline' : 'ghost'} className={latestFilter==='todos' ? 'border-cine text-cine hover-cine' : 'text-cine'} onClick={() => setLatestFilter('todos')}>Todos</Button>
              <Button size="sm" variant={latestFilter==='aprovados' ? 'outline' : 'ghost'} className={latestFilter==='aprovados' ? 'border-cine text-cine hover-cine' : 'text-cine'} onClick={() => setLatestFilter('aprovados')}>Aprovados</Button>
              <Button size="sm" variant={latestFilter==='publicados' ? 'outline' : 'ghost'} className={latestFilter==='publicados' ? 'border-cine text-cine hover-cine' : 'text-cine'} onClick={() => setLatestFilter('publicados')}>Publicados</Button>
            </div>
            <Link to="/jobs" className="link-cine inline-flex items-center">Ver todos <ChevronRight className="h-4 w-4 ml-1"/></Link>
          </div>
        }
      >
        <VideoGrid jobs={applyStatusFilter(jobs, latestFilter)} channelNameMap={channelNameMap} onPreview={handlePreview} openMenuId={openMenuId} onOpenMenu={handleMenu} />
      </SectionCard>
      <SectionCard
        title="Shorts & Reels"
        subtitle="Até 8 colunas em xl; filtro rápido de status"
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-cine overflow-hidden">
              <Button size="sm" variant={shortsFilter==='todos' ? 'outline' : 'ghost'} className={shortsFilter==='todos' ? 'border-cine text-cine hover-cine' : 'text-cine'} onClick={() => setShortsFilter('todos')}>Todos</Button>
              <Button size="sm" variant={shortsFilter==='aprovados' ? 'outline' : 'ghost'} className={shortsFilter==='aprovados' ? 'border-cine text-cine hover-cine' : 'text-cine'} onClick={() => setShortsFilter('aprovados')}>Aprovados</Button>
              <Button size="sm" variant={shortsFilter==='publicados' ? 'outline' : 'ghost'} className={shortsFilter==='publicados' ? 'border-cine text-cine hover-cine' : 'text-cine'} onClick={() => setShortsFilter('publicados')}>Publicados</Button>
            </div>
            <Link to="/jobs" className="link-cine inline-flex items-center">Ver todos <ChevronRight className="h-4 w-4 ml-1"/></Link>
          </div>
        }
      >
        <ShortsGrid jobs={applyStatusFilter(jobs, shortsFilter)} channelNameMap={channelNameMap} onPreview={handlePreview} openMenuId={openMenuId} onOpenMenu={handleMenu} />
      </SectionCard>
      <Separator className="bg-white/10" />
      <SectionCard
        title="Vídeos aleatórios"
        subtitle={`Amostra aleatória; 4 colunas no lg — Página ${randomPage + 1}/${maxPage + 1}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="bg-cine-surface-90 text-cine hover-cine border border-cine"><Wand2 className="h-4 w-4 mr-1"/>Gerar ideias</Button>
            <Link to="/create" className="gradient-cine text-white rounded-md px-3 py-2 inline-flex items-center"><Play className="h-4 w-4 mr-1"/>Novo Short</Link>
            <Link to="/jobs" className="link-cine inline-flex items-center">Ver todos <ChevronRight className="h-4 w-4 ml-1"/></Link>
            <div className="flex items-center gap-1 ml-2">
              <Button size="sm" variant="outline" onClick={() => setRandomPage((p) => Math.max(0, p - 1))} disabled={randomPage <= 0}><ChevronLeft className="h-4 w-4 mr-1"/>Anterior</Button>
              <Button size="sm" variant="outline" onClick={() => setRandomPage((p) => Math.min(maxPage, p + 1))} disabled={randomPage >= maxPage}>Próxima<ChevronRight className="h-4 w-4 ml-1"/></Button>
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="number"
                  min={1}
                  max={maxPage + 1}
                  value={randomInput}
                  onChange={(e) => setRandomInput(e.target.value)}
                  className="w-16 px-2 py-1 text-sm rounded-md border border-cine bg-cine-surface-90 text-cine"
                />
                <Button size="sm" variant="outline" className="border-cine text-cine hover-cine" onClick={() => {
                  const n = Math.max(1, Math.min(maxPage + 1, parseInt(randomInput || '1', 10)));
                  if (!Number.isNaN(n)) setRandomPage(n - 1);
                }}>Ir</Button>
              </div>
            </div>
          </div>
        }
      >
        <VideoGrid jobs={pagedRandomJobs} channelNameMap={channelNameMap} onPreview={handlePreview} openMenuId={openMenuId} onOpenMenu={handleMenu} />
      </SectionCard>

      {previewId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cine-bg)]/80">
          <div className="w-[92%] max-w-4xl rounded-2xl border border-cine bg-cine-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-cine text-sm">Preview do Vídeo #{previewId}</div>
              <button className="px-3 py-1.5 text-sm rounded-md border border-cine text-cine hover-cine" onClick={() => setPreviewId(null)}>Fechar</button>
            </div>
            <div className="rounded-xl overflow-hidden border border-cine">
              <video controls autoPlay src={`${api.defaults.baseURL}/jobs/${previewId}/preview`} className="w-full h-full aspect-video" />
            </div>
          </div>
        </div>
      )}

      {publishJobId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cine-bg)]/80">
          <div className="w-[92%] max-w-lg rounded-2xl border border-cine bg-cine-surface p-4">
            <div className="text-cine text-base font-medium mb-3">Selecionar canal do YouTube</div>
            <div className="text-cine-muted text-sm mb-2">Escolha o canal vinculado à sua conta Google para publicar o vídeo.</div>
            <div className="rounded-lg border border-cine bg-cine-surface-90 p-3">
              {loadingYt ? (
                <div className="text-cine-muted text-sm">Carregando canais…</div>
              ) : ytChannels.length > 0 ? (
                <div className="space-y-2">
                  {ytChannels.map((c) => (
                    <label key={c.external_id} className="flex items-center gap-2 text-cine text-sm">
                      <input
                        type="radio"
                        className="accent-[var(--cine-primary)]"
                        checked={selectedExternalId === c.external_id}
                        onChange={() => setSelectedExternalId(c.external_id)}
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-cine-muted text-sm">Nenhum canal encontrado. Verifique o login do Google e tentativas anteriores.</div>
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-1.5 text-sm rounded-md border border-cine text-cine hover-cine" onClick={cancelPublishSelection}>Cancelar</button>
              <button className="px-3 py-1.5 text-sm rounded-md gradient-cine text-white" onClick={confirmPublishWithSelection}>Confirmar e publicar</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cine-bg)]/80">
          <div className="w-[92%] max-w-md rounded-2xl border border-cine bg-cine-surface p-4">
            <div className="text-cine text-base font-medium mb-2">Confirmar exclusão</div>
            <div className="text-cine-muted text-sm mb-4">Tem certeza que deseja excluir o Job #{confirmDeleteId}? Esta ação não pode ser desfeita.</div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-sm rounded-md border border-cine text-cine hover-cine" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              <button className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700" onClick={() => { if (confirmDeleteId) { deleteJob.mutate(confirmDeleteId); setConfirmDeleteId(null); } }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}