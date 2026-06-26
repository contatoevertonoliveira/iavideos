import React from 'react'
import SectionCard from '@/components/ui/SectionCard'
import { useRBAC } from '@/features/auth/useRBAC'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdmin } from './hooks/useAdmin'
import { toastError, toastSuccess } from '@/lib/toast'
import UserTable from './components/UserTable'

export default function UsersPage() {
  const { role } = useRBAC()
  const qc = useQueryClient()
  const { seedUsers, listUsers, setUserRole } = useAdmin()

  const usersQ = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => await listUsers(),
    staleTime: 10_000,
    enabled: role === 'superAdmin',
  })

  const seedM = useMutation({
    mutationFn: async () => await seedUsers(),
    onSuccess: () => {
      toastSuccess('Seed de usuários executado')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toastError('Falha ao executar seed'),
  })

  const setRoleM = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: 'superAdmin' | 'moderator' | 'user' | 'viewer' }) => await setUserRole(id, role),
    onSuccess: () => {
      toastSuccess('Role atualizada')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toastError('Falha ao atualizar role'),
  })
  return (
    <div className="p-4 md:p-6 space-y-6">
      <SectionCard title="Usuários" subtitle="Gestão de usuários">
        {role !== 'superAdmin' ? (
          <div className="text-red-400 text-sm">Apenas superAdmin pode visualizar/editar usuários.</div>
        ) : (
          <>
            <div className="d-flex justify-content-end mb-2">
              <button className="btn btn-outline-light btn-sm rounded-3" onClick={() => seedM.mutate()} disabled={seedM.isPending}>
                {seedM.isPending ? 'Seed…' : 'Seed usuários'}
              </button>
            </div>
            {usersQ.isLoading && <div className="text-white/60 text-sm">Carregando usuários…</div>}
            {usersQ.error && <div className="text-red-400 text-sm">Falha ao carregar usuários</div>}
            {Array.isArray(usersQ.data) && usersQ.data.length > 0 ? (
              <UserTable users={usersQ.data as any} onChangeRole={(id, r) => setRoleM.mutate({ id, role: r })} />
            ) : (
              !usersQ.isLoading && <div className="text-white/60 text-sm">Nenhum usuário encontrado</div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  )
}