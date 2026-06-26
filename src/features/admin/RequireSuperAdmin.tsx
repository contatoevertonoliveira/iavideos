import React from 'react'
import { Navigate } from 'react-router-dom'
import { useRBAC } from '@/features/auth/useRBAC'

export default function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { role } = useRBAC()
  if (role !== 'superAdmin') {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}