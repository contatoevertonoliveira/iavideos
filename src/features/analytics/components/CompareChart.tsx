import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

type Series = { social_account_id: number; label: string; color?: string; timeseries: { date: string; views: number; watch_hours: number }[] };

export default function CompareChart({ series }: { series: Series[] }) {
  const dates = series[0]?.timeseries?.map((p) => p.date) || [];
  const merged = dates.map((d) => {
    const row: any = { date: d };
    series.forEach((s) => {
      const pt = s.timeseries.find((p) => p.date === d);
      row[`views_${s.social_account_id}`] = pt?.views ?? null;
    });
    return row;
  });
  return (
    <div className="border rounded p-3">
      <div className="text-sm mb-2">Comparativo entre contas</div>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {series.map((s) => (
              <Line key={s.social_account_id} type="monotone" dataKey={`views_${s.social_account_id}`} stroke={s.color || "#2563eb"} name={s.label} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}