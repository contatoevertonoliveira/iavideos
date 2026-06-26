import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAnalytics } from "./hooks/useAnalytics";
import DateRangePicker from "./components/DateRangePicker";
import AccountPlatformPicker from "./components/AccountPlatformPicker";
import TopVideosTable from "./components/TopVideosTable";
import ExportButtons from "./components/ExportButtons";

export default function VideosRank() {
  const [accounts, setAccounts] = useState<{ id: number; display_name?: string; provider: string }[]>([]);
  const [platform, setPlatform] = useState("youtube");
  const [accountId, setAccountId] = useState<number | undefined>(undefined);
  const [start, setStart] = useState<string>(() => new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const { overview, fetchOverview } = useAnalytics();

  useEffect(() => {
    async function loadAccounts() {
      try {
        const { data } = await api.get("/accounts");
        setAccounts(data || []);
      } catch (err) {
        if (import.meta.env.VITE_USE_MOCKS === "true") {
          setAccounts([
            { id: 1, provider: "youtube", display_name: "Canal Principal" },
            { id: 2, provider: "youtube", display_name: "Cortes" },
          ]);
        }
      }
    }
    loadAccounts();
  }, []);

  useEffect(() => {
    fetchOverview({ start, end, social_account_id: accountId, platform });
  }, [start, end, platform, accountId]);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"views" | "watch_hours" | "ctr">("views");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const raw = overview?.top_videos || [];
  const filtered = raw.filter((v: any) => (v.title || "").toLowerCase().includes(query.toLowerCase()));
  const sorted = filtered.sort((a: any, b: any) => {
    const va = a[sortKey] ?? 0; const vb = b[sortKey] ?? 0;
    return sortDir === "asc" ? va - vb : vb - va;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <AccountPlatformPicker accounts={accounts} platform={platform} social_account_id={accountId} onChange={(v) => { setPlatform(v.platform); setAccountId(v.social_account_id); setPage(1); }} />
        <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); setPage(1); }} />
      </header>

      <div className="flex items-center gap-3">
        <input className="border rounded px-2 py-1 text-sm" placeholder="Buscar por título" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        <select className="border rounded px-2 py-1 text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
          <option value="views">Views</option>
          <option value="watch_hours">Watch time</option>
          <option value="ctr">CTR</option>
        </select>
        <select className="border rounded px-2 py-1 text-sm" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      <TopVideosTable data={paged} onOpen={(id) => (window.location.href = `/analytics/video/${id}`)} />

      <ExportButtons csvName={`top_videos_${start}_${end}.csv`} csvData={paged.map((v: any) => ({
        video_id: v.video_id,
        title: v.title,
        views: v.views,
        watch_hours: v.watch_hours,
        ctr: v.ctr,
        impressions: v.impressions,
        avg_view_duration_sec: v.avg_view_duration_sec,
      }))} />

      <div className="flex items-center justify-between">
        <div className="text-sm">Página {page} de {totalPages}</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 border rounded" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button>
          <button className="px-2 py-1 border rounded" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Próxima</button>
        </div>
      </div>
    </div>
  );
}