import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Row = { source: string; ctr: number };

export default function CTRBySourceBar({ data }: { data: Row[] }) {
  return (
    <div className="border rounded p-3" title="CTR: cliques / impressões">
      <div className="text-sm mb-2">CTR por origem</div>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="source" />
            <YAxis />
            <Tooltip formatter={(v) => [`${(Number(v) * 100).toFixed(1)}%`, "CTR"]} />
            <Bar dataKey="ctr" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}