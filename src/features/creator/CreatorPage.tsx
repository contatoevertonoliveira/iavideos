import { useEffect, useMemo, useState } from 'react'
import SectionCard from '@/components/ui/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Select from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toastError, toastSuccess } from '@/lib/toast'
import { api } from '@/lib/api'
import DreamInput from './components/DreamInput'
import MediaPreview from './components/MediaPreview'
import { usePiModels } from './hooks/usePiModels'

type Kind = 'image' | 'video' | 'audio'
type Mode = 'guided' | 'auto'

export default function CreatorPage() {
  const [kind, setKind] = useState<Kind>('image')
  const [mode, setMode] = useState<Mode>('guided')
  const [globalModel, setGlobalModel] = useState<string>('')

  const [step, setStep] = useState<number>(1)
  const [intent, setIntent] = useState<string>('')

  // Image fields
  const [imageModel, setImageModel] = useState<string>('')
  const [imageMode, setImageMode] = useState<'txt2img' | 'img2img'>('txt2img')
  const [imageRefUrl, setImageRefUrl] = useState<string>('')

  // Video fields
  const [videoModel, setVideoModel] = useState<string>('')
  const [videoSource, setVideoSource] = useState<'story' | 'title' | 'images' | 'cloneFromUrl'>('images')
  const [videoStory, setVideoStory] = useState<string>('')
  const [videoTitle, setVideoTitle] = useState<string>('')
  const [videoRefs, setVideoRefs] = useState<string>('')
  const [videoMusic, setVideoMusic] = useState<boolean>(false)
  const [videoSfx, setVideoSfx] = useState<boolean>(false)
  const [videoTalking, setVideoTalking] = useState<boolean>(false)
  const [videoVoiceClone, setVideoVoiceClone] = useState<boolean>(false)

  // Audio fields
  const [audioModel, setAudioModel] = useState<string>('')
  const [audioKind, setAudioKind] = useState<'music' | 'narration' | 'voice-clone'>('music')
  const [audioNotes, setAudioNotes] = useState<string>('')
  const [audioBpm, setAudioBpm] = useState<string>('')
  const [audioKey, setAudioKey] = useState<string>('')

  // Publication
  const [askConfirm, setAskConfirm] = useState<boolean>(true)
  const [autoPublish, setAutoPublish] = useState<boolean>(false)
  const [channels, setChannels] = useState<Array<{ channel_id: number; name: string; platform: string; connected: boolean }>>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])

  // Result
  const [taskId, setTaskId] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [savedAssetId, setSavedAssetId] = useState<number | null>(null)
  const [savedFinalAssetId, setSavedFinalAssetId] = useState<number | null>(null)

  const { loading: modelsLoading, globalModels, getModelsForKind } = usePiModels()

  const FALLBACK_BY_KIND: Record<Kind, string | undefined> = {
    image: 'Qubico/flux1-dev',
    video: 'kling',
    audio: 'kling',
  }

  // Auto-seleciona o primeiro modelo disponível ao trocar o tipo
  useEffect(() => {
    const assignIfMissing = (current: string, models: Array<{ value: string; label: string }>) => {
      if (!models || models.length === 0) return ''
      const exists = models.some((m) => m.value === current)
      return exists ? current : models[0].value
    }
    if (kind === 'image') {
      const models = getModelsForKind('image' as any)
      setImageModel((prev) => assignIfMissing(prev, models))
    } else if (kind === 'video') {
      const models = getModelsForKind('video' as any)
      setVideoModel((prev) => assignIfMissing(prev, models))
    } else if (kind === 'audio') {
      const models = getModelsForKind('tts' as any)
      setAudioModel((prev) => assignIfMissing(prev, models))
    }
  }, [kind, getModelsForKind])

  useEffect(() => {
    async function fetchTargets() {
      try {
        const res = await api.get('/publications/targets')
        setChannels(res.data || [])
      } catch (e) {
        // ignore
      }
    }
    fetchTargets()
  }, [])

  const kindModels = useMemo(() => {
    const kmap: Record<Kind, string> = { image: 'image', video: 'video', audio: 'tts' }
    return getModelsForKind(kmap[kind] as any)
  }, [kind, getModelsForKind])

  function next() {
    setStep((s) => Math.min(s + 1, 4))
  }

  function buildContract() {
    return {
      kind,
      autoMode: mode === 'auto',
      intent,
      models: { global: globalModel, image: imageModel, video: videoModel, audio: audioModel },
      image: kind === 'image' ? { mode: imageMode, prompt: intent, refUrl: imageRefUrl } : undefined,
      video: kind === 'video' ? { source: videoSource, story: videoStory, title: videoTitle, refUrls: videoRefs ? videoRefs.split(/\s*,\s*/) : [] } : undefined,
      audio: kind === 'audio' ? { kind: audioKind, notes: audioNotes || intent, bpm: audioBpm, key: audioKey } : undefined,
      publication: { auto: autoPublish, askConfirm, channels: selectedChannels },
    }
  }

  async function startCreate() {
    // Verifica modelos e aplica fallback quando necessário
    let effGlobal = globalModel
    let effImage = imageModel
    let effVideo = videoModel
    let effAudio = audioModel

    const messages: string[] = []

    if (kind === 'image' && !effImage) {
      const options = getModelsForKind('image' as any)
      effImage = options[0]?.value || FALLBACK_BY_KIND.image || ''
      if (effImage && effImage !== imageModel) setImageModel(effImage)
      if (!options[0]) messages.push(`Modelo fallback aplicado (imagem): ${effImage}`)
    }

    if (kind === 'video' && !effVideo) {
      const options = getModelsForKind('video' as any)
      effVideo = options[0]?.value || FALLBACK_BY_KIND.video || ''
      if (effVideo && effVideo !== videoModel) setVideoModel(effVideo)
      if (!options[0]) messages.push(`Modelo fallback aplicado (vídeo): ${effVideo}`)
    }

    if (kind === 'audio' && !effAudio) {
      const options = getModelsForKind('tts' as any)
      effAudio = options[0]?.value || FALLBACK_BY_KIND.audio || ''
      if (effAudio && effAudio !== audioModel) setAudioModel(effAudio)
      if (!options[0]) messages.push(`Modelo fallback aplicado (áudio): ${effAudio}`)
    }

    // Exigir que ao menos uma preferência de vídeo esteja marcada; se nenhuma, aplicar padrão
    if (kind === 'video' && !videoMusic && !videoSfx && !videoTalking && !videoVoiceClone) {
      setVideoMusic(true)
      messages.push('Selecionado por padrão: Música de fundo')
    }

    const contract = {
      kind,
      autoMode: mode === 'auto',
      intent,
      models: { global: effGlobal, image: effImage, video: effVideo, audio: effAudio },
      image: kind === 'image' ? { mode: imageMode, prompt: intent, refUrl: imageRefUrl } : undefined,
      video: kind === 'video' ? { source: videoSource, story: videoStory, title: videoTitle, refUrls: videoRefs ? videoRefs.split(/\s*,\s*/) : [] } : undefined,
      audio: kind === 'audio' ? { kind: audioKind, notes: audioNotes || intent, bpm: audioBpm, key: audioKey } : undefined,
      publication: { auto: autoPublish, askConfirm, channels: selectedChannels },
    }
    try {
      const res = await api.post('/api/create', contract)
      const data = res.data || {}
      setTaskId(data.task_id || '')
      setPreviewUrl(data.preview_url || '')
      setStatus('QUEUED')
      setSavedAssetId(null)
      setSavedFinalAssetId(null)
      toastSuccess(messages.length ? `Geração iniciada · ${messages.join(' · ')}` : 'Geração iniciada')
      setStep(3)
    } catch (e: any) {
      toastError(String(e?.message || e))
    }
  }

  async function pollPreview() {
    if (!taskId) return
    try {
      const res = await api.get(`/api/preview/${taskId}?kind=${kind}`)
      const data = res.data || {}
      setStatus(data.status || '')
      if (data.preview_url) setPreviewUrl(data.preview_url)
    } catch (e) {
      // ignore
    }
  }

  // Upload automático da prévia para a galeria quando disponível
  useEffect(() => {
    async function uploadToGallery() {
      if (!previewUrl || savedAssetId) return
      try {
        const resp = await fetch(previewUrl)
        const blob = await resp.blob()
        const ct = resp.headers.get('content-type') || blob.type || ''
        const ext = ct.includes('image/png') ? '.png'
          : ct.includes('image/jpeg') ? '.jpg'
          : ct.includes('video/mp4') ? '.mp4'
          : ct.includes('audio/mpeg') ? '.mp3'
          : ct.includes('audio/wav') ? '.wav'
          : (previewUrl.match(/\.[a-zA-Z0-9]+$/)?.[0] || '.bin')
        const filename = `preview_${kind}${ext}`
        const file = new File([blob], filename, { type: ct || 'application/octet-stream' })
        const form = new FormData()
        form.append('file', file)
        const res = await api.post('/media/upload', form)
        const id = res.data?.media_asset_id
        if (id) {
          setSavedAssetId(id)
          toastSuccess('Prévia salva na galeria')
        }
      } catch (e: any) {
        // Não bloquear a experiência; apenas informar
        toastError(`Falha ao salvar na galeria: ${String(e?.message || e)}`)
      }
    }
    uploadToGallery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl, kind, taskId])

  // Upload do resultado final quando status indicar conclusão
  useEffect(() => {
    async function uploadFinal() {
      if (status !== 'DONE' || !previewUrl || savedFinalAssetId) return
      try {
        const resp = await fetch(previewUrl)
        const blob = await resp.blob()
        const ct = resp.headers.get('content-type') || blob.type || ''
        const ext = ct.includes('image/png') ? '.png'
          : ct.includes('image/jpeg') ? '.jpg'
          : ct.includes('video/mp4') ? '.mp4'
          : ct.includes('audio/mpeg') ? '.mp3'
          : ct.includes('audio/wav') ? '.wav'
          : (previewUrl.match(/\.[a-zA-Z0-9]+$/)?.[0] || '.bin')
        const filename = `final_${kind}${ext}`
        const file = new File([blob], filename, { type: ct || 'application/octet-stream' })
        const form = new FormData()
        form.append('file', file)
        const res = await api.post('/media/upload', form)
        const id = res.data?.media_asset_id
        if (id) {
          setSavedFinalAssetId(id)
          toastSuccess('Resultado final salvo na galeria')
        }
      } catch (e: any) {
        toastError(`Falha ao salvar o resultado final: ${String(e?.message || e)}`)
      }
    }
    uploadFinal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, previewUrl, kind])

  async function doPublish() {
    try {
      const res = await api.post('/api/publish', { job_id: null, channels: selectedChannels, auto: autoPublish, askConfirm })
      if (res.data?.ok) toastSuccess('Publicação enviada')
    } catch (e: any) {
      toastError(String(e?.message || e))
    }
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-[#0B1220]/80 backdrop-blur border-b border-white/10 py-3">
        <div className="flex flex-wrap items-center gap-3 px-2">
          <div className="flex items-center gap-2">
            {(['image','video','audio'] as Kind[]).map((k) => (
              <label key={k} className={`px-3 py-1 rounded-lg border border-white/10 cursor-pointer ${kind === k ? 'bg-white/15' : 'bg-transparent'}`}>
                <input type="radio" name="kind" className="mr-1" checked={kind === k} onChange={() => setKind(k)} />
                {k === 'image' ? 'Imagem' : k === 'video' ? 'Vídeo' : 'Áudio/Música'}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">Guiado</span>
            <Switch checked={mode === 'auto'} onCheckedChange={(v) => setMode(v ? 'auto' : 'guided')} />
            <span className="text-xs text-white/70">Automático</span>
          </div>
          <div className="flex-1" />
          <div className="min-w-[240px]">
            <Select
              value={globalModel}
              onChange={setGlobalModel}
              options={kindModels.map((m) => ({ value: m.value, label: m.label }))}
              placeholder="Modelo Global"
            />
          </div>
        </div>
      </div>

      <SectionCard title="O que vamos fazer hoje?" subtitle="Responda e seguimos com o fluxo">
        <DreamInput value={intent} onChange={setIntent} onSubmit={() => next()} />
        <div className="flex justify-end mt-2">
          <Button onClick={next} className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]">Avançar</Button>
        </div>
      </SectionCard>

      {step >= 2 && (
        <SectionCard title="Escolhas da criação" subtitle="Modelos e parâmetros conforme o tipo">
          {kind === 'image' && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-white/70">Modelo de imagem</label>
                  <Select
                    value={imageModel}
                    onChange={setImageModel}
                    options={getModelsForKind('image' as any).map((m) => ({ value: m.value, label: m.label }))}
                    placeholder="Selecione…"
                  />
                </div>
                <div>
                  {mode !== 'auto' && (
                    <label className="text-xs text-white/70">Modo</label>
                  )}
                  {mode !== 'auto' && (
                  <div className="flex gap-2">
                    {(['txt2img','img2img'] as const).map((mm) => (
                      <button key={mm} className={`px-3 py-2 rounded-lg border border-white/10 ${imageMode === mm ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/5 text-white/80'}`} onClick={() => setImageMode(mm)}>{mm === 'txt2img' ? 'Texto → Imagem' : 'Imagem → Imagem'}</button>
                    ))}
                  </div>
                  )}
                </div>
              </div>
              {mode !== 'auto' && imageMode === 'img2img' && (
                <div>
                  <label className="text-xs text-white/70">Imagem base (URL)</label>
                  <Input value={imageRefUrl} onChange={(e) => setImageRefUrl(e.target.value)} placeholder="https://…" className="bg-white/5 border-white/10 text-white" />
                </div>
              )}
            </div>
          )}

          {kind === 'video' && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-white/70">Modelo de vídeo</label>
                  <Select
                    value={videoModel}
                    onChange={setVideoModel}
                    options={getModelsForKind('video' as any).map((m) => ({ value: m.value, label: m.label }))}
                    placeholder="Selecione…"
                  />
                </div>
                <div>
                  {mode !== 'auto' && (
                    <>
                      <label className="text-xs text-white/70">Origem</label>
                      <div className="flex flex-wrap gap-2">
                        {(['story','title','images','cloneFromUrl'] as const).map((src) => (
                          <button key={src} className={`px-3 py-2 rounded-lg border border-white/10 ${videoSource === src ? 'bg-[#FFD700] text-[#212529]' : 'bg-white/5 text-white/80'}`} onClick={() => setVideoSource(src)}>
                            {src === 'story' && 'A partir de história'}
                            {src === 'title' && 'A partir de título'}
                            {src === 'images' && 'A partir de imagens'}
                            {src === 'cloneFromUrl' && 'Clonar de vídeos (links)'}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {mode !== 'auto' && videoSource === 'story' && (
                <div>
                  <label className="text-xs text-white/70">História</label>
                  <Input value={videoStory} onChange={(e) => setVideoStory(e.target.value)} placeholder="Era uma vez…" className="bg-white/5 border-white/10 text-white" />
                </div>
              )}
              {mode !== 'auto' && videoSource === 'title' && (
                <div>
                  <label className="text-xs text-white/70">Título</label>
                  <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Meu vídeo épico" className="bg-white/5 border-white/10 text-white" />
                </div>
              )}
              {mode !== 'auto' && videoSource === 'images' && (
                <div>
                  <label className="text-xs text-white/70">Imagens (URL, separadas por vírgula)</label>
                  <Input value={videoRefs} onChange={(e) => setVideoRefs(e.target.value)} placeholder="https://img1, https://img2" className="bg-white/5 border-white/10 text-white" />
                </div>
              )}
              {mode !== 'auto' && videoSource === 'cloneFromUrl' && (
                <div>
                  <label className="text-xs text-white/70">Vídeos de referência (URL, separadas por vírgula)</label>
                  <Input value={videoRefs} onChange={(e) => setVideoRefs(e.target.value)} placeholder="https://youtu.be/… , https://…" className="bg-white/5 border-white/10 text-white" />
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {mode !== 'auto' && (
                  <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={videoMusic} onChange={(e) => setVideoMusic(e.target.checked)} /> Música de fundo</label>
                )}
                {mode !== 'auto' && (
                  <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={videoSfx} onChange={(e) => setVideoSfx(e.target.checked)} /> Efeitos sonoros</label>
                )}
                {mode !== 'auto' && (
                  <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={videoTalking} onChange={(e) => setVideoTalking(e.target.checked)} /> Personagens falam</label>
                )}
                {mode !== 'auto' && (
                  <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={videoVoiceClone} onChange={(e) => setVideoVoiceClone(e.target.checked)} /> Clonar voz</label>
                )}
              </div>
            </div>
          )}

          {kind === 'audio' && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-white/70">Modelo de áudio</label>
                  <Select
                    value={audioModel}
                    onChange={setAudioModel}
                    options={getModelsForKind('audio' as any).map((m) => ({ value: m.value, label: m.label }))}
                    placeholder="Selecione…"
                  />
                </div>
                <div>
                  {mode !== 'auto' && (
                    <label className="text-xs text-white/70">Tipo</label>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(['music','narration','voice-clone'] as const).map((t) => (
                      <button key={t} className={`px-3 py-2 rounded-lg border border-white/10 ${audioKind === t ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/5 text-white/80'}`} onClick={() => setAudioKind(t)}>
                        {t === 'music' && 'Música'}
                        {t === 'narration' && 'Narração'}
                        {t === 'voice-clone' && 'Clonagem de voz'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
                {mode !== 'auto' && (
                  <div>
                    <label className="text-xs text-white/70">Instruções criativas</label>
                    <Input value={audioNotes} onChange={(e) => setAudioNotes(e.target.value)} placeholder="Instrumentos, estilo, humor, referências…" className="bg-white/5 border-white/10 text-white" />
                  </div>
                )}
              <div className="grid gap-3 sm:grid-cols-2">
                {mode !== 'auto' && (
                  <div>
                    <label className="text-xs text-white/70">BPM</label>
                    <Input value={audioBpm} onChange={(e) => setAudioBpm(e.target.value)} placeholder="120" className="bg-white/5 border-white/10 text-white" />
                  </div>
                )}
                {mode !== 'auto' && (
                  <div>
                    <label className="text-xs text-white/70">Tom/Key</label>
                    <Input value={audioKey} onChange={(e) => setAudioKey(e.target.value)} placeholder="C#m" className="bg-white/5 border-white/10 text-white" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-2">
            <Button onClick={startCreate} className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]">Avançar</Button>
          </div>
        </SectionCard>
      )}

      {step >= 3 && (
        <SectionCard title="Prévia" subtitle="Veja antes de publicar">
          <div className="space-y-3">
            <div className="text-sm text-white/80">Status: {status || 'desconhecido'}</div>
            {previewUrl && (
              <MediaPreview kind={kind} title={intent || 'Prévia'} src={previewUrl} />
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={pollPreview}>Atualizar prévia</Button>
              <Button onClick={() => setStep(4)} className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]">Avançar</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step >= 4 && (
        <SectionCard title="Publicação" subtitle="Configurações de publicação">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={askConfirm} onChange={(e) => setAskConfirm(e.target.checked)} /> Sempre pedir confirmação antes de publicar</label>
            <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} /> Publicação automática</label>
            {autoPublish && (
              <div>
                <div className="text-xs text-white/70 mb-1">Canais conectados</div>
                <div className="flex flex-wrap gap-2">
                  {channels.filter((c) => c.connected).map((c) => {
                    const key = `${c.platform}:${c.channel_id}`
                    const selected = selectedChannels.includes(key)
                    return (
                      <button key={key} className={`px-3 py-2 rounded-lg border border-white/10 ${selected ? 'bg-white/15' : 'bg-white/5 text-white/80'}`} onClick={() => setSelectedChannels((arr) => selected ? arr.filter((x) => x !== key) : [...arr, key])}>
                        {c.platform} · {c.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80">
              <div className="font-mono whitespace-pre-wrap">
                {JSON.stringify(buildContract(), null, 2)}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(3)}>Voltar</Button>
              <Button onClick={doPublish} className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]">Avançar</Button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  )
}