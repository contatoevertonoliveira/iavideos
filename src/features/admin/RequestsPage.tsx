import React, { useEffect } from 'react'
import SectionCard from '@/components/ui/SectionCard'
import { useRBAC } from '@/features/auth/useRBAC'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdmin } from './hooks/useAdmin'
import { toastError, toastSuccess } from '@/lib/toast'
import RequestList from './components/RequestList'
import ApproveRejectBar from './components/ApproveRejectBar'
import { useSSE } from '@/lib/useSSE'
import { api } from '@/lib/api'

export default function RequestsPage() {
  const { role } = useRBAC()
  const qc = useQueryClient()
  const { listRequests, approveRequest, rejectRequest } = useAdmin()

  const reqQ = useQuery({
    queryKey: ['admin-requests', { status: 'pending' }],
    queryFn: async () => await listRequests('pending'),
    staleTime: 5_000,
    enabled: role === 'superAdmin',
  })

  const approveM = useMutation({
    mutationFn: async (id: number) => await approveRequest(id),
    onSuccess: () => {
      toastSuccess('Solicitação aprovada')
      qc.invalidateQueries({ queryKey: ['admin-requests'] })
    },
    onError: () => toastError('Falha ao aprovar solicitação'),
  })
  const rejectM = useMutation({
    mutationFn: async (id: number) => await rejectRequest(id),
    onSuccess: () => {
      toastSuccess('Solicitação rejeitada')
      qc.invalidateQueries({ queryKey: ['admin-requests'] })
    },
    onError: () => toastError('Falha ao rejeitar solicitação'),
  })

  // SSE para atualizar automaticamente a lista quando criar/resolver
  useSSE({
    url: `${api.defaults.baseURL}/sse/admin`,
    onEvent: (evt: any) => {
      if (evt?.type === 'request_created' || evt?.type === 'request_resolved') {
        qc.invalidateQueries({ queryKey: ['admin-requests'] })
      }
    },
  })
  return (
    <div className="p-4 md:p-6 space-y-6">
      <SectionCard title="Solicitações" subtitle="Fila de aprovações">
        {role !== 'superAdmin' ? (
          <div className="text-red-400 text-sm">Apenas superAdmin pode aprovar/rejeitar solicitações.</div>
        ) : (
          <>
            {reqQ.isLoading && <div className="text-white/60 text-sm">Carregando solicitações…</div>}
            {reqQ.error && <div className="text-red-400 text-sm">Falha ao carregar solicitações</div>}
            {Array.isArray(reqQ.data) && reqQ.data.length > 0 ? (
              <div className="space-y-3">
                {reqQ.data.map((r: any) => (
                  <div key={r.id} className="border border-white/10 rounded p-3 d-flex justify-content-between align-items-center">
                    <div className="flex-grow-1 me-3">
                      <RequestList requests={[r]} />
                    </div>
                    <ApproveRejectBar onApprove={() => approveM.mutate(r.id)} onReject={() => rejectM.mutate(r.id)} />
                  </div>
                ))}
              </div>
            ) : (
              !reqQ.isLoading && <div className="text-white/60 text-sm">Nenhuma solicitação pendente</div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  )
}