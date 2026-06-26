import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { theme } from '@/styles/theme'

type Props = {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export default function SectionCard({ title, subtitle, actions, children, className }: Props) {
  return (
    <div className={cn('rounded-xl border border-white/10 backdrop-blur', theme.surface, className)}>
      {(title || actions || subtitle) && (
        <div className="px-4 py-3 border-b border-white/10 rounded-t-xl">
          <div className="flex items-center justify-between w-full">
            <div>
              {title && <div className="text-sm font-medium text-white/90">{title}</div>}
              {subtitle && <div className="text-[11px] text-white/60">{subtitle}</div>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}
      <div className="p-4 text-white/80">{children}</div>
    </div>
  )
}