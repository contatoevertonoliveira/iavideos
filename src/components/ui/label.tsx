import React from 'react'
import { cn } from '@/lib/utils'

type Props = React.LabelHTMLAttributes<HTMLLabelElement>

export function Label({ className, ...props }: Props) {
  return <label className={cn('text-sm font-medium', className)} {...props} />
}