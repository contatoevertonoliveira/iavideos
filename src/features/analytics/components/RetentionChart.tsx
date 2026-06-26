import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Point = { t_sec: number; retention_pct: number };

export default function RetentionChart({ data }: { data: Point[] }) {
  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  return (
    <div className="border rounded p-3">
      <div className="text-sm mb-2">Retenção de audiência</div>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t_sec" tickFormatter={fmtTime} />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(v, n, p: any) => [`${v}%`, `Retenção`]} labelFormatter={(x) => fmtTime(Number(x))} />
            <Line type="monotone" dataKey="retention_pct" stroke="#2563eb" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}