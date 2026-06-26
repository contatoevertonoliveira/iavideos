import React from 'react'
import { cn } from '@/lib/utils'

type Props = React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' }

export function Badge({ className, variant = 'default', ...props }: Props) {
  const variants = {
    default: 'inline-flex items-center rounded px-2 py-0.5 text-xs bg-slate-900/60 border border-white/10',
    secondary: 'inline-flex items-center rounded px-2 py-0.5 text-xs bg-white/10 text-white',
  }
  return <span className={cn(variants[variant], className)} {...props} />
}