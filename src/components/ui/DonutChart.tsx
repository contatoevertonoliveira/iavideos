import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'

type Datum = { name: string; value: number; color?: string }
type Props = {
  data: Datum[]
}

const defaultColors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

export default function DonutChart({ data }: Props) {
  return (
    <div className="rounded-lg bg-slate-900/60 text-slate-100 p-4 border border-slate-800">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || defaultColors[index % defaultColors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1f2937' }} />
          <Legend verticalAlign="bottom" height={24} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}