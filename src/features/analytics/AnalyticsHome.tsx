import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAnalytics } from "./hooks/useAnalytics";
import DateRangePicker from "./components/DateRangePicker";
import AccountPlatformPicker from "./components/AccountPlatformPicker";
import KpiCards from "./components/KpiCards";
import TimeSeriesChart from "./components/TimeSeriesChart";
import TrafficPie from "./components/TrafficPie";
import RetentionChart from "./components/RetentionChart";
import TopVideosTable from "./components/TopVideosTable";
import ExportButtons from "./components/ExportButtons";
import EmptyAnalyticsState from "./components/EmptyAnalyticsState";

export default function AnalyticsHome() {
  const [accounts, setAccounts] = useState<{ id: number; display_name?: string; provider: string }[]>([]);
  const [platform, setPlatform] = useState("youtube");
  const [accountId, setAccountId] = useState<number | undefined>(undefined);
  const [start, setStart] = useState<string>(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const { overview, fetchOverview, getOverview, limits, needReauth, fetchLimits } = useAnalytics();
  const chartRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState({ views: true, watch_hours: true, impressions: false, ctr: false });
  const [deltas, setDeltas] = useState<Record<string, number>>({});

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
    fetchLimits({ social_account_id: accountId, platform });
    // calcular delta vs período anterior
    (async () => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
      const prevEnd = new Date(startDate.getTime() - 86400000);
      const prevStart = new Date(prevEnd.getTime() - (diffDays - 1) * 86400000);
      const prevStartStr = prevStart.toISOString().slice(0, 10);
      const prevEndStr = prevEnd.toISOString().slice(0, 10);
      try {
        const prev = await getOverview({ start: prevStartStr, end: prevEndStr, social_account_id: accountId, platform });
        const cur = overview?.totals || {};
        const p = prev?.totals || {};
        const calc = (a?: number, b?: number) => (a != null && b != null && b !== 0 ? (a - b) / b : 0);
        const d = {
          views: calc(cur.views, p.views),
          watch_hours: calc(cur.watch_hours, p.watch_hours),
          avg_view_duration_sec: calc(cur.avg_view_duration_sec, p.avg_view_duration_sec),
          ctr: calc(cur.ctr, p.ctr),
          impressions: calc(cur.impressions, p.impressions),
          likes: calc(cur.likes, p.likes),
          comments: calc(cur.comments, p.comments),
          shares: calc(cur.shares, p.shares),
          subs_net: calc(cur.subs_net, p.subs_net),
          revenue: calc(cur.revenue, p.revenue),
        } as Record<string, number>;
        setDeltas(d);
      } catch (err) {
        // ignora erro de delta quando sem dados
      }
    })();
  }, [start, end, platform, accountId, overview]);

  const onToggle = (key: keyof typeof show) => setShow((s) => ({ ...s, [key]: !s[key] }));

  const timeseries = overview?.timeseries || [];
  const traffic = overview?.traffic_sources || [];
  const retention = overview?.retention || [];
  const topVideos = overview?.top_videos || [];

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <AccountPlatformPicker
          accounts={accounts}
          platform={platform}
          social_account_id={accountId}
          onChange={(v) => { setPlatform(v.platform); setAccountId(v.social_account_id); }}
        />
        <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} />
      </header>

      {needReauth && (
        <div className="p-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm flex items-center justify-between">
          <span>Faltam escopos de analytics para esta conta. Alguns dados podem estar indisponíveis.</span>
          <a href="/settings/accounts" className="no-underline transition-colors duration-150 hover:bg-[#FFD700] hover:!text-[#16132B]">Reautorizar conta com escopo de analytics</a>
        </div>
      )}

      {limits?.warnings?.length > 0 && (
        <div className="p-3 rounded border border-orange-300 bg-orange-50 text-orange-800 text-sm">
          Avisos de quota: {limits.warnings.join(", ")}
        </div>
      )}

      <KpiCards totals={overview?.totals} deltas={deltas} />

      {timeseries.length ? (
        <div ref={chartRef}>
          <TimeSeriesChart data={timeseries} show={show} onToggle={onToggle} />
        </div>
      ) : <EmptyAnalyticsState />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrafficPie data={traffic} />
        <RetentionChart data={retention} />
      </div>

      <TopVideosTable data={topVideos} onOpen={(id) => (window.location.href = `/analytics/video/${id}`)} />

      <ExportButtons targetRef={chartRef as any} csvName={`overview_${start}_${end}.csv`} csvData={timeseries} />
    </div>
  );
}