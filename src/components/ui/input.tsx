import React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'rounded-lg bg-cine-surface border border-cine px-3 py-2 text-sm text-cine placeholder:text-cine-muted',
        'focus:outline-none focus:ring-2 ring-cine-primary transition-colors duration-200 ease-cine',
        className,
      )}
      {...props}
    />
  )
}