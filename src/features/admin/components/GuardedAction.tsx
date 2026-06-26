import React from 'react'
import { useRBAC } from '@/features/auth/useRBAC'

type Props = {
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'
  subject: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function GuardedAction({ action, subject, children, fallback }: Props) {
  const { can } = useRBAC()
  return can(action, subject) ? <>{children}</> : <>{fallback ?? null}</>
}