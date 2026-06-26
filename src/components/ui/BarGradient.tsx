import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

type Datum = { name: string; value: number }
type Props = {
  data: Datum[]
  colorFrom?: string
  colorTo?: string
}

export default function BarGradient({ data, colorFrom = '#34d399', colorTo = '#06b6d4' }: Props) {
  const gradientId = 'barGradient'
  return (
    <div className="rounded-lg bg-slate-900/60 text-slate-100 p-4 border border-slate-800">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorFrom} stopOpacity={0.95} />
              <stop offset="100%" stopColor={colorTo} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fontSize: 12 }} />
          <YAxis stroke="#cbd5e1" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1f2937' }} />
          <Bar dataKey="value" fill={`url(#${gradientId})`} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}