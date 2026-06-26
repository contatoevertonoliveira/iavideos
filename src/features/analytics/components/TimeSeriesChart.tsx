import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

type Point = { date: string; views?: number; watch_hours?: number; impressions?: number; ctr?: number };

type Props = {
  data: Point[];
  show: { views: boolean; watch_hours: boolean; impressions: boolean; ctr: boolean };
  onToggle: (key: keyof Point) => void;
};

export default function TimeSeriesChart({ data, show, onToggle }: Props) {
  return (
    <div className="border rounded p-3">
      <div className="flex gap-2 mb-2">
        {(["views", "watch_hours", "impressions", "ctr"] as const).map((k) => (
          <label key={k} className="text-sm flex items-center gap-1">
            <input type="checkbox" checked={show[k]} onChange={() => onToggle(k)} />
            {k}
          </label>
        ))}
      </div>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {show.views && <Line type="monotone" dataKey="views" stroke="#2563eb" name="Views" dot={false} />}
            {show.watch_hours && <Line type="monotone" dataKey="watch_hours" stroke="#16a34a" name="Watch hours" dot={false} />}
            {show.impressions && <Line type="monotone" dataKey="impressions" stroke="#f59e0b" name="Impressions" dot={false} />}
            {show.ctr && <Line type="monotone" dataKey="ctr" stroke="#ef4444" name="CTR" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}