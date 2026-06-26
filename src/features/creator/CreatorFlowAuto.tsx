import { useEffect, useState } from 'react'
import SectionCard from '@/components/ui/SectionCard'
import { Button } from '@/components/ui/button'
import { toastSuccess } from '@/lib/toast'
import DreamCanvas from './components/DreamCanvas'
import AiSuggestionList from './components/AiSuggestionList'
import MediaPreview from './components/MediaPreview'
import PublishModal from './components/PublishModal'
import { api } from '@/lib/api'
import { useCreatorStore } from './useCreatorStore'

type Props = { prompt: string; analyzed: any }

export default function CreatorFlowAuto({ prompt }: Props) {
  const [suggestions, setSuggestions] = useState<Array<{ title: string; summary: string }>>([])
  const [chosen, setChosen] = useState<number | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [finished, setFinished] = useState<boolean>(false)
  const [openPublish, setOpenPublish] = useState<boolean>(false)
  const [blocks, setBlocks] = useState<Array<{ type: string; content: string }>>([{ type: 'prompt', content: prompt }])
  const {
    setStory,
    setMedia,
    setTitle,
    setConnectedPlatforms,
    productionTaskId,
    productionStatus,
    productionPreviewUrl,
    productionError,
    productionJobId,
    setProductionTaskId,
    setProductionStatus,
    setProductionPreviewUrl,
    setProductionError,
    setProductionJobId,
    resetProduction,
    chosenSuggestionIndex,
    setChosenSuggestionIndex,
  } = useCreatorStore()

  useEffect(() => {
    let active = true
    // Tenta uma análise rica; fallback para sugestões simples; fallback final mock
    api.post('/creator/analyze', { prompt }).then((res) => {
      if (!active) return
      const data = res.data || {}
      setSuggestions(data.suggestions || [])
      if (Array.isArray(data.blocks) && data.blocks.length > 0) {
        setBlocks(data.blocks)
      } else {
        setBlocks([{ type: 'prompt', content: prompt }])
      }
    }).catch(() => {
      api.get('/creator/suggestions', { params: { prompt } }).then((res) => {
        if (!active) return
        setSuggestions(res.data?.suggestions || [])
        setBlocks([{ type: 'prompt', content: prompt }])
      }).catch(() => {
        if (!active) return
        const mock = [
          { title: 'O Blues do Jacaré', summary: 'Um jacaré encontra sua voz nas margens do rio.' },
          { title: 'O Sonho de Bambam', summary: 'Um personagem sonha em construir um farol de ideias.' },
          { title: 'Melodia do Faroleiro', summary: 'Uma canção guiando viajantes por tempestades.' },
        ]
        setSuggestions(mock)
        setBlocks([{ type: 'prompt', content: prompt }])
      })
    })
    // Simula redes conectadas; integração real pode ler /accounts ou /channels/:id/credentials
    setConnectedPlatforms(['YouTube'])
    return () => { active = false }
  }, [prompt])

  useEffect(() => {
    if (chosenSuggestionIndex !== null && chosenSuggestionIndex !== undefined) {
      setChosen(chosenSuggestionIndex)
    }
  }, [chosenSuggestionIndex])

  async function chooseIdea(idx: number) {
    setChosen(idx)
    setChosenSuggestionIndex(idx)
    setBlocks((arr) => [...arr, { type: 'choice', content: `Escolheu: ${suggestions[idx].title}` }])
    setTitle(suggestions[idx].title)
    setStory(suggestions[idx].summary)
    setFinished(false)
    setProgress(0)
    // 1) Tentar fluxo Jobs full-run (retorna job_id + vídeo pronto)
    try {
      const chRes = await api.get('/channels', { params: { limit: 1 } })
      const channels = (chRes.data || []) as Array<{ id: number }>
      const channelId = channels[0]?.id
      if (!channelId) throw new Error('no_channel')
      const body = {
        channel_id: channelId,
        title: suggestions[idx].title,
        user_text: suggestions[idx].summary,
        mode: 'ai_generate',
        kind: 'story',
        duration_seconds: 45,
      }
      const res = await api.post('/jobs/full-run', body)
      const jobId = res.data?.job_id
      if (jobId) {
        setProductionJobId(jobId)
        const preview = `${import.meta.env.VITE_API_BASE || ''}/jobs/${jobId}/preview`
        setProductionPreviewUrl(preview)
        setMedia({ video: preview })
        setFinished(true)
        setProgress(100)
        toastSuccess('Vídeo renderizado e pronto!')
        setBlocks((arr) => [...arr, { type: 'task', content: `job_id=${jobId}` }, { type: 'preview', content: preview }])
        setProductionStatus('RENDERED')
        setProductionError(null)
        return
      }
      throw new Error('full_run_failed')
    } catch (_err) {
      // 2) Fallback: usar criação universal (PiAPI) e polling
      try {
        const contract = {
          kind: 'video',
          autoMode: true,
          intent: suggestions[idx].title,
          video: { source: 'story', story: suggestions[idx].summary },
        }
        const res = await api.post('/api/create', contract)
        const tid = res.data?.task_id || res.data?.taskId || ''
        if (tid) {
          setProductionTaskId(tid)
          setBlocks((arr) => [...arr, { type: 'task', content: `task_id=${tid}` }])
          // Poll de status/preview
          let p = 0
          const interval = setInterval(async () => {
            p = Math.min(100, p + 5)
            setProgress(p)
            try {
              const st = await api.get(`/api/preview/${tid}?kind=video`)
              const data = st.data || {}
              setProductionStatus(data.status || '')
              if (data.preview_url) {
                setProductionPreviewUrl(data.preview_url)
                setMedia({ video: data.preview_url })
                setFinished(true)
                clearInterval(interval)
                toastSuccess('Prévia pronta')
                setBlocks((arr) => [...arr, { type: 'preview', content: data.preview_url }])
              }
            } catch (e) {
              // continuar polling silenciosamente
            }
          }, 1500)
        } else {
          setProductionError('Falha ao criar task')
        }
      } catch (e: any) {
        // 3) Fallback final: simulação
        setProductionError(String(e?.message || 'Erro na produção'))
        let p = 0
        const t = setInterval(() => {
          p += 10
          setProgress(p)
          if (p >= 100) {
            clearInterval(t)
            setFinished(true)
            toastSuccess('Produção concluída (stub)')
            setBlocks((arr) => [...arr, { type: 'preview', content: 'Preview pronto' }])
            setMedia({ video: '/media/previews/auto-generated.mp4' })
          }
        }, 300)
      }
    }
  }

  // Retomar polling ao voltar para a página (se task_id persistido e sem preview)
  useEffect(() => {
    if (productionTaskId && !productionPreviewUrl) {
      let p = progress
      const interval = setInterval(async () => {
        p = Math.min(100, p + 5)
        setProgress(p)
        try {
          const st = await api.get(`/api/preview/${productionTaskId}?kind=video`)
          const data = st.data || {}
          setProductionStatus(data.status || '')
          if (data.preview_url) {
            setProductionPreviewUrl(data.preview_url)
            setMedia({ video: data.preview_url })
            setFinished(true)
            clearInterval(interval)
            toastSuccess('Prévia pronta')
            setBlocks((arr) => [...arr, { type: 'preview', content: data.preview_url }])
          }
        } catch {
          // seguir polling
        }
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [productionTaskId])

  function reprocess() {
    setFinished(false)
    setProgress(0)
    resetProduction()
    const idx = chosenSuggestionIndex ?? chosen
    if (idx !== null && idx !== undefined) {
      chooseIdea(idx)
    }
  }

  function saveLocal() {
    const base = String((import.meta as any)?.env?.VITE_API_BASE || '')
    const url = productionJobId ? `${base}/jobs/${productionJobId}/preview` : (productionPreviewUrl || '')
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = suggestions[chosen ?? 0]?.title ? `${suggestions[chosen ?? 0].title}.mp4` : 'video.mp4'
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Roteiro Automático 🤖" subtitle="IA cria tudo sozinha e mostra resultado">
        <AiSuggestionList suggestions={suggestions} onChoose={chooseIdea} chosenIndex={chosen} />
        {chosen !== null && (
          <div className="mt-4">
            {!finished && (
              <div className="space-y-2">
                <div className="text-sm text-white/80">A IA está criando seu universo...</div>
                <div className="w-full h-2 rounded bg-white/10">
                  <div className="h-2 rounded bg-[#06B6D4]" style={{ width: `${progress}%` }} />
                </div>
                {productionStatus && (
                  <div className="text-xs text-white/60">Status: {productionStatus}</div>
                )}
                {productionError && (
                  <div className="mt-2 rounded-xl border border-red-400/40 bg-red-500/10 p-2 text-red-200 flex items-center justify-between">
                    <span>Erro: {productionError}</span>
                    <Button variant="secondary" onClick={reprocess}>Reprocessar</Button>
                  </div>
                )}
              </div>
            )}
            {finished && (
              <div className="space-y-3">
                <MediaPreview kind="video" title={suggestions[chosen].title} />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setOpenPublish(true)}>✨ Publicar agora</Button>
                  <Button variant="outline" onClick={reprocess}>Reprocessar</Button>
                  <Button className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white" onClick={saveLocal}>Salvar localmente</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <DreamCanvas blocks={blocks} />

      <PublishModal open={openPublish} onClose={() => setOpenPublish(false)} onPublish={() => { setOpenPublish(false) }} />
    </div>
  )
}