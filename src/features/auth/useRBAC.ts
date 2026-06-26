import { useAuthStore } from '@/features/auth/store'

type Action = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export'

export function useRBAC() {
  const role = (useAuthStore((s) => s.user.role) ?? 'user') as 'superAdmin' | 'moderator' | 'user' | 'viewer'
  const matrix: Record<'superAdmin' | 'moderator' | 'user' | 'viewer', Record<Action, boolean>> = {
    superAdmin: { create: true, read: true, update: true, delete: true, approve: true, export: true },
    moderator: { create: true, read: true, update: true, delete: false, approve: false, export: false },
    user: { create: false, read: true, update: false, delete: false, approve: false, export: false },
    viewer: { create: false, read: true, update: false, delete: false, approve: false, export: false },
  }
  const can = (action: Action, _subject: string, _ctx?: any) => !!matrix[role][action]
  return { role, can }
}