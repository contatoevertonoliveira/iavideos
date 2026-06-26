import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toastError, toastSuccess } from '@/lib/toast'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import { useCreatorStore } from '../useCreatorStore'

type Props = {
  open: boolean
  onClose: () => void
  onPublish?: () => void
}

export default function PublishModal({ open, onClose, onPublish }: Props) {
  const { story, media, title, tags, setTitle, setTags, description, setDescription, connectedPlatforms, productionJobId, refreshPublicationProgress } = useCreatorStore()
  const [audience, setAudience] = useState<'Infantil'|'Geral'|'Adulto'>('Geral')
  const [platforms, setPlatforms] = useState<{ name: string; selected: boolean }[]>([
    { name: 'YouTube', selected: true },
    { name: 'TikTok', selected: false },
    { name: 'Instagram', selected: false },
  ])
  const [schedule, setSchedule] = useState<{ enabled: boolean; at?: string }>({ enabled: false })

  useEffect(() => {
    if (!title) setTitle((story ? story.split('\n')[0] : 'Meu Vídeo dos Sonhos').slice(0, 80))
    if (!description) setDescription(story || 'Resumo gerado pela IA (stub)')
    if (!tags || tags.length === 0) setTags(generateTagsFromStory(story))
  }, [story])

  const noNetworksConnected = !connectedPlatforms || connectedPlatforms.length === 0
  const selectedPlatforms = useMemo(() => platforms.filter(p => p.selected).map(p => p.name), [platforms])
  const canPublish = !noNetworksConnected && selectedPlatforms.length > 0 && Boolean(productionJobId)

  function togglePlatform(name: string) {
    setPlatforms((prev) => prev.map((p) => p.name === name ? { ...p, selected: !p.selected } : p))
  }

  async function handlePublish() {
    if (!canPublish) {
      toastError('Conecte ao menos uma rede e selecione plataforma')
      return
    }
    if (!productionJobId) {
      toastError('Nenhum job gerado para publicar')
      return
    }
    try {
      // 1) Aprovar o job
      await api.post(`/jobs/${productionJobId}/approve`)
      // 2) Publicar nas plataformas selecionadas
      const platformsPayload = selectedPlatforms.map((p) => p.toLowerCase())
      await api.post(`/jobs/${productionJobId}/publish`, {
        platforms: platformsPayload,
        metadata: { title, description, tags }
      })
      toastSuccess('Publicação iniciada!')
      try { await refreshPublicationProgress(productionJobId) } catch {}
      onPublish?.()
      onClose()
    } catch (e) {
      toastError('Falha ao publicar. Verifique credenciais ou tente novamente.')
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[620px] rounded-2xl border border-white/10 bg-[#0B1220] p-6">
        <div className="text-lg font-semibold text-white mb-1">Publicar</div>
        <div className="text-sm text-white/70">Campos pré-preenchidos automaticamente pela IA</div>

        {noNetworksConnected && (
          <div className="mt-4 rounded-xl border border-yellow-400/40 bg-yellow-500/10 p-3 text-yellow-200">
            ⚠️ Para publicar, conecte uma conta primeiro. <Link to="/configuracoes/contas" className="underline">Conectar Contas</Link>
          </div>
        )}

        <div className="mt-4 grid gap-3">
          <input value={title || ''} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
          <textarea value={description || ''} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" rows={4} className="rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
          <input value={(tags || []).join(', ')} onChange={(e) => setTags(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="#tags" className="rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
        </div>

        <div className="mt-4 grid gap-3">
          <div className="text-sm text-white/80">Público-alvo</div>
          <div className="flex gap-2">
            {(['Infantil','Geral','Adulto'] as const).map((a) => (
              <button key={a} className={`px-3 py-2 rounded-lg border border-white/10 ${audience === a ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/5 text-white/80'}`} onClick={() => setAudience(a)}>{a}</button>
            ))}
          </div>

          <div className="text-sm text-white/80">Plataformas conectadas</div>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button key={p.name} className={`px-3 py-2 rounded-lg border ${p.selected ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]' : 'border-white/10 bg-white/5 text-white/80'}`} onClick={() => togglePlatform(p.name)}>{p.name}</button>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <label className="flex items-center gap-2 text-white/80">
              <input type="checkbox" checked={schedule.enabled} onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })} /> Agendar
            </label>
            {schedule.enabled && (
              <input type="datetime-local" value={schedule.at || ''} onChange={(e) => setSchedule({ ...schedule, at: e.target.value })} className="rounded bg-white/5 border border-white/10 px-3 py-2 text-white" />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={!canPublish} onClick={handlePublish}>Publicar</Button>
        </div>
      </div>
    </div>
  )
}

function generateTagsFromStory(story?: string) {
  if (!story) return ['ia', 'criação', 'vídeo']
  const words = story.toLowerCase().replace(/[^a-zà-ú0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 3)
  const seed = Array.from(new Set(words)).slice(0, 6)
  return seed.length ? seed : ['história', 'música', 'narração']
}