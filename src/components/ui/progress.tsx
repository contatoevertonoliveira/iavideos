import React from 'react'
import { cn } from '@/lib/utils'

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('relative rounded-full bg-white/10 h-2', className)}>
      <div className="absolute left-0 top-0 h-full rounded-full bg-white/40" style={{ width: `${v}%` }} />
    </div>
  )
}