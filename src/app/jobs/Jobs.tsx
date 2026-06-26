import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import SectionCard from '@/components/ui/SectionCard'
import { toastError, toastSuccess } from '@/lib/toast'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GuardedAction } from '@/features/admin/components/GuardedAction'
import { useAdmin } from '@/features/admin/hooks/useAdmin'
import { useRBAC } from '@/features/auth/useRBAC'

type Job = {
  id: number
  channel_id: number | null
  status: string
}

export default function Jobs() {
  const qc = useQueryClient()
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [showLegend, setShowLegend] = useState<boolean>(false)
  const { createDeleteRequest } = useAdmin()
  const { role } = useRBAC()

  const { data, isLoading, error } = useQuery<Job[]>({
    queryKey: ['jobs', { limit: 100 }],
    queryFn: async () => (await api.get('/jobs', { params: { limit: 100 } })).data,
    staleTime: 30_000,
  })

  const renderJob = useMutation({
    mutationFn: async (id: number) => (await api.post(`/jobs/${id}/render`)).data,
    onSuccess: () => {
      toastSuccess('Render enfileirado')
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao renderizar'),
  })

  const approveJob = useMutation({
    mutationFn: async (id: number) => (await api.post(`/jobs/${id}/approve`)).data,
    onSuccess: () => {
      toastSuccess('Job aprovado')
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao aprovar'),
  })

  const publishJob = useMutation({
    mutationFn: async (id: number) => (await api.post(`/jobs/${id}/publish`)).data,
    onSuccess: () => {
      toastSuccess('Publicação enfileirada')
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        toastError(e?.response?.data?.detail || 'Job não aprovado. Aprove antes de publicar.')
      } else {
        toastError(e?.response?.data?.detail || 'Falha ao publicar')
      }
    },
  })

  const genStory = useMutation({
    mutationFn: async (id: number) => (await api.post(`/jobs/${id}/generate-story`)).data,
    onSuccess: () => {
      toastSuccess('História gerada / fila iniciada')
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao gerar história'),
  })

  async function openPreview(id: number) {
    setPreviewId(id)
  }

  const deleteJob = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/jobs/${id}`)).data,
    onSuccess: () => {
      toastSuccess('Job excluído')
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao excluir job'),
  })

  const requestDeleteJob = useMutation({
    mutationFn: async (id: number) => (await createDeleteRequest('job', id, 'Solicitação de exclusão via moderador')).ok,
    onSuccess: () => toastSuccess('Solicitação de exclusão criada; aguardando aprovação'),
    onError: () => toastError('Falha ao criar solicitação'),
  })

  const jobs = Array.isArray(data) ? data : []

  function badgeClass(status: string) {
    const s = (status || '').toUpperCase()
    if (s.includes('FAIL') || s.includes('ERROR')) return 'badge-cine badge-cine--error'
    if (s.includes('APPROVED')) return 'badge-cine badge-cine--approved'
    if (s.includes('PUBLISH')) return 'badge-cine badge-cine--published'
    if (s.includes('RENDER')) return 'badge-cine badge-cine--rendering'
    if (s.includes('QUEUE') || s.includes('PENDING')) return 'badge-cine badge-cine--pending'
    if (s.includes('DRAFT')) return 'badge-cine badge-cine--draft'
    if (s.includes('STORY')) return 'badge-cine badge-cine--story'
    return 'badge-cine'
  }

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      <SectionCard
        title="Jobs"
        subtitle="Acompanhar pipeline de criação e publicação."
        actions={
          <Button variant="ghost" size="sm" onClick={() => setShowLegend((v) => !v)}>
            {showLegend ? 'Ocultar legenda' : 'Mostrar legenda'}
          </Button>
        }
      >
        {showLegend && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/60">Legenda:</span>
            <span className="badge-cine badge-cine--approved">APPROVED</span>
            <span className="badge-cine badge-cine--published">PUBLISHED</span>
            <span className="badge-cine badge-cine--pending">PENDING/QUEUED</span>
            <span className="badge-cine badge-cine--rendering">RENDERING</span>
            <span className="badge-cine badge-cine--error">ERROR/FAILED</span>
            <span className="badge-cine badge-cine--draft">DRAFT</span>
            <span className="badge-cine badge-cine--story">STORY_GENERATED</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="table table-sm align-middle w-100 text-white">
            <thead>
              <tr className="text-white/70">
                <th>ID</th>
                <th>Canal</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="text-sm text-white/60 py-3">Carregando…</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={4} className="text-sm text-red-400 py-3">Falha ao carregar jobs</td>
                </tr>
              )}
              {jobs.map((j) => (
                <tr key={j.id} className="border-top border-white/10">
                  <td>{j.id}</td>
                  <td>{j.channel_id ?? '—'}</td>
                  <td>
                    <span className={badgeClass(j.status)}>{j.status}</span>
                  </td>
                  <td className="text-sm">
                    <div className="d-flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => genStory.mutate(j.id)}>Gerar história</Button>
                      <Button size="sm" variant="secondary" onClick={() => renderJob.mutate(j.id)}>Render</Button>
                      <Button size="sm" variant="secondary" onClick={() => approveJob.mutate(j.id)}>Aprovar</Button>
                      <Button size="sm" variant="primary" onClick={() => publishJob.mutate(j.id)}>Publicar</Button>
                      <GuardedAction action="delete" subject={`job:${j.id}`} fallback={role === 'moderator' ? (
                        <button className="px-3 py-1.5 text-xs rounded-md border border-cine bg-cine-surface text-red-600 hover-cine" title="Ação sob aprovação" onClick={() => requestDeleteJob.mutate(j.id)}>Solicitar exclusão</button>
                      ) : null}>
                        <Button size="sm" variant="secondary" className="text-red-600" onClick={() => setConfirmDeleteId(j.id)}>Excluir</Button>
                      </GuardedAction>
                      <Button size="sm" variant="secondary" onClick={() => openPreview(j.id)}>Preview</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-sm text-white/60 py-3">Nenhum job encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {previewId !== null && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
          <div className="bg-[#16132B] border border-white/10 rounded-3 p-3" style={{ width: '90%', maxWidth: 960 }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="text-white/80 text-sm">Preview do Job #{previewId}</div>
              <Button size="sm" variant="secondary" onClick={() => setPreviewId(null)}>Fechar</Button>
            </div>
            <div className="ratio ratio-16x9 rounded-3 overflow-hidden border border-white/10">
              <video controls src={`${api.defaults.baseURL}/jobs/${previewId}/preview`} className="w-100 h-100" />
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
          <div className="bg-[#16132B] border border-white/10 rounded-3 p-3" style={{ width: 420 }}>
            <div className="text-white fw-medium mb-2">Confirmar exclusão</div>
            <div className="text-white-50 small mb-3">Tem certeza que deseja excluir o Job #{confirmDeleteId}? Esta ação não pode ser desfeita.</div>
            <div className="d-flex justify-content-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
              <Button size="sm" variant="secondary" className="text-red-600" onClick={() => { if (confirmDeleteId) { deleteJob.mutate(confirmDeleteId); setConfirmDeleteId(null); } }}>Excluir</Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}