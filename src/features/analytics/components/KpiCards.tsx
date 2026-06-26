type KPI = {
  views: number;
  watch_hours: number;
  avg_view_duration_sec: number;
  ctr: number;
  impressions: number;
  likes?: number;
  comments?: number;
  shares?: number;
  subs_net?: number;
  revenue?: number;
};

function fmtNumber(n?: number) {
  if (n == null) return "-";
  return Intl.NumberFormat("pt-BR").format(n);
}
function fmtPct(n?: number) {
  if (n == null) return "-";
  return `${(n * 100).toFixed(1)}%`;
}
function fmtDurationSec(sec?: number) {
  if (!sec && sec !== 0) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function KpiCards({ totals, deltas }: { totals?: KPI; deltas?: Record<string, number> }) {
  const t = (totals || {}) as KPI;
  const cards = [
    { key: "views", label: "Views", value: fmtNumber(t.views) },
    { key: "watch_hours", label: "Watch time (h)", value: fmtNumber(t.watch_hours) },
    { key: "avg_view_duration_sec", label: "Avg. view duration", value: fmtDurationSec(t.avg_view_duration_sec) },
    { key: "ctr", label: "CTR (thumb)", value: fmtPct(t.ctr), tooltip: "CTR: cliques / impressões" },
    { key: "impressions", label: "Impressions", value: fmtNumber(t.impressions) },
    { key: "likes", label: "Likes", value: fmtNumber(t.likes) },
    { key: "comments", label: "Comments", value: fmtNumber(t.comments) },
    { key: "shares", label: "Shares", value: fmtNumber(t.shares) },
    { key: "subs_net", label: "Subs (net)", value: fmtNumber(t.subs_net) },
    { key: "revenue", label: "Revenue", value: t.revenue != null ? `R$ ${t.revenue.toFixed(2)}` : "-" },
  ] as const;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c) => {
        const d = deltas ? deltas[c.key as string] : undefined;
        const dText = d != null ? `${d > 0 ? "+" : ""}${(d * 100).toFixed(1)}%` : undefined;
        return (
          <div key={c.label} className="border rounded p-3" title={c.tooltip}>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">{c.label}</div>
              {dText && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded ${d >= 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}>
                  {d >= 0 ? "▲" : "▼"} {dText}
                </span>
              )}
            </div>
            <div className="mt-1 text-lg font-semibold">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}