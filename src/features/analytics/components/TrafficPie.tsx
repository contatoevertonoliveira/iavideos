import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Source = { source: string; views: number; watch_hours: number };

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

export default function TrafficPie({ data }: { data: Source[] }) {
  return (
    <div className="border rounded p-3">
      <div className="text-sm mb-2">Origem de tráfego</div>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="views" nameKey="source" cx="50%" cy="50%" outerRadius={100} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}