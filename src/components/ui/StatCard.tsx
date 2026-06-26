type Props = {
  title: string
  value: string | number
  subtitle?: string
  delta?: string
  accent?: 'violet' | 'cyan' | 'emerald' | 'none'
}

import { cn } from '@/lib/utils'
import { theme } from '@/styles/theme'

export default function StatCard({ title, value, subtitle, delta, accent = 'none' }: Props) {
  const accentClass =
    accent === 'violet'
      ? 'border-l-violet-600'
      : accent === 'cyan'
      ? 'border-l-cyan-500'
      : accent === 'emerald'
      ? 'border-l-emerald-500'
      : 'border-l-slate-800'

  return (
    <div className={cn('rounded-xl border border-white/10 backdrop-blur p-4', theme.card, accentClass, 'border-l-4 text-white')}>
      <div className="text-xs text-white/60">{title}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className="text-2xl font-semibold text-white">{value}</div>
        {delta && <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/80">{delta}</span>}
      </div>
      {subtitle && <div className="text-[11px] text-white/60 mt-2">{subtitle}</div>}
    </div>
  )
}