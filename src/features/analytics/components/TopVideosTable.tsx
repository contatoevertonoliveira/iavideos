type Row = { video_id: number; title: string; views: number; watch_hours: number; ctr?: number; impressions?: number; avg_view_duration_sec?: number; posted_at?: string; thumbnail_url?: string };

export default function TopVideosTable({ data, onOpen }: { data: Row[]; onOpen?: (id: number) => void }) {
  return (
    <div className="border rounded p-3">
      <div className="text-sm mb-2">Top vídeos</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Thumb</th>
              <th className="p-2">Título</th>
              <th className="p-2">Views</th>
              <th className="p-2">Watch hours</th>
              <th className="p-2">CTR</th>
              <th className="p-2">Impressions</th>
              <th className="p-2">Avg dur.</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.video_id} className="border-t">
                <td className="p-2"><img src={r.thumbnail_url || "/vite.svg"} alt="thumb" className="w-12 h-7 object-cover rounded" /></td>
                <td className="p-2">{r.title}</td>
                <td className="p-2">{Intl.NumberFormat("pt-BR").format(r.views)}</td>
                <td className="p-2">{Intl.NumberFormat("pt-BR").format(r.watch_hours)}</td>
                <td className="p-2">{r.ctr != null ? `${(r.ctr * 100).toFixed(1)}%` : "-"}</td>
                <td className="p-2">{r.impressions != null ? Intl.NumberFormat("pt-BR").format(r.impressions) : "-"}</td>
                <td className="p-2">{r.avg_view_duration_sec != null ? `${Math.floor(r.avg_view_duration_sec / 60)}:${String(r.avg_view_duration_sec % 60).padStart(2, "0")}` : "-"}</td>
                <td className="p-2">
                  <button className="border rounded px-2 py-1" onClick={() => onOpen && onOpen(r.video_id)}>Detalhes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}