import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toastError, toastSuccess } from '@/lib/toast'

type Job = {
  id: number
  channel_id: number | null
  status: string
  result?: Record<string, any>
  created_at?: string
}

export default function JobDetails() {
  const { id } = useParams()
  const jobId = Number(id)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: job, isLoading, error } = useQuery<Job>({
    queryKey: ['job', jobId],
    enabled: Number.isFinite(jobId),
    queryFn: async () => (await api.get(`/jobs/${jobId}`)).data,
  })

  const [title, setTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const t = (job?.result as any)?.title || ''
    setTitle(t)
  }, [job?.id])

  const updateJob = useMutation({
    mutationFn: async (payload: { title?: string }) => (await api.put(`/jobs/${jobId}`, payload)).data,
    onSuccess: () => {
      toastSuccess('Job atualizado')
      qc.invalidateQueries({ queryKey: ['job', jobId] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao atualizar job'),
  })

  const approveJob = useMutation({
    mutationFn: async () => (await api.post(`/jobs/${jobId}/approve`)).data,
    onSuccess: () => { toastSuccess('Job aprovado'); qc.invalidateQueries({ queryKey: ['job', jobId] }); qc.invalidateQueries({ queryKey: ['jobs'] }) },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao aprovar'),
  })

  const publishJob = useMutation({
    mutationFn: async () => (await api.post(`/jobs/${jobId}/publish`)).data,
    onSuccess: () => { toastSuccess('Publicação iniciada'); qc.invalidateQueries({ queryKey: ['job', jobId] }); qc.invalidateQueries({ queryKey: ['jobs'] }) },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        toastError(e?.response?.data?.detail || 'Job não aprovado. Aprove antes de publicar.')
      } else {
        toastError('Falha ao publicar')
      }
    },
  })

  const deleteJob = useMutation({
    mutationFn: async () => (await api.delete(`/jobs/${jobId}`)).data,
    onSuccess: () => { toastSuccess('Job excluído'); qc.invalidateQueries({ queryKey: ['jobs'] }); navigate('/jobs') },
    onError: (e: any) => toastError(e?.response?.data?.detail || 'Falha ao excluir job'),
  })

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

  if (!Number.isFinite(jobId)) {
    return <div className="text-red-400">ID de job inválido</div>
  }

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Detalhes do Job #{jobId}</h2>
        <Link to="/jobs" className="link-cine">Voltar para Jobs</Link>
      </div>

      {isLoading && <div className="text-white/70">Carregando…</div>}
      {error && <div className="text-red-400">Falha ao carregar job</div>}

      {job && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-3">
            <div className="rounded-xl border border-white/10 bg-[#1C1835] p-4">
              <div className="text-white/80 text-sm mb-2">Preview</div>
              <div className="rounded-lg overflow-hidden border border-white/10">
                <video controls src={`${api.defaults.baseURL}/jobs/${jobId}/preview`} className="w-full h-full aspect-video" />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1C1835] p-4">
              <div className="text-white/80 text-sm mb-2">Informações</div>
              <div className="text-white/70 text-sm">Canal: {job.channel_id ?? '—'}</div>
              <div className="text-white/70 text-sm">Status: <span className={badgeClass(job.status)}>{job.status}</span></div>
              <div className="mt-3">
                <label className="block text-xs text-white/60 mb-1">Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md bg-[#16132B] border border-white/10 text-white px-3 py-2 text-sm" placeholder="Título do vídeo" />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => updateJob.mutate({ title })}>Salvar alterações</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-[#1C1835] p-4">
              <div className="text-white/80 text-sm mb-3">Ações</div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="primary" onClick={() => approveJob.mutate()}>Aprovar</Button>
                <Button size="sm" variant="primary" onClick={async () => {
                  if (job.status !== 'APPROVED') {
                    try { await approveJob.mutateAsync(); await publishJob.mutateAsync(); } catch {}
                  } else { publishJob.mutate(); }
                }}>Publicar</Button>
                <Button size="sm" variant="secondary" className="text-red-600" onClick={() => setConfirmDelete(true)}>Excluir</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="w-[92%] max-w-md rounded-2xl border border-white/10 bg-[#16132B] p-4">
            <div className="text-white text-base font-medium mb-2">Confirmar exclusão</div>
            <div className="text-white/80 text-sm mb-4">Tem certeza que deseja excluir o Job #{jobId}? Esta ação não pode ser desfeita.</div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
              <Button size="sm" variant="secondary" className="text-red-600" onClick={() => deleteJob.mutate()}>Excluir</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}