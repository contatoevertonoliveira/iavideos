import { useState } from 'react'
import { useProviders } from './hooks/useProviders'
import CapabilityMatrix from './components/CapabilityMatrix'
import ContextSwitches from './components/ContextSwitches'

type Props = { onClose: () => void }

export default function ProviderFormModal({ onClose }: Props) {
  const { discover, createM } = useProviders()
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [disc, setDisc] = useState<any | null>(null)
  const [selectedCaps, setSelectedCaps] = useState<string[]>([])
  const [contexts, setContexts] = useState<string[]>(['F11','F12','F03','F04'])
  const [defaults, setDefaults] = useState<Record<string,string>>({})

  const onDiscover = async () => {
    setDiscovering(true)
    try {
      const result = await discover(baseUrl, apiKey)
      setDisc(result)
      setName(result?.name || name)
      const caps = result?.capabilities || []
      setSelectedCaps(caps)
      // reset defaults when discover changes
      const models = result?.models || {}
      const init: Record<string,string> = {}
      Object.keys(models).forEach(task => {
        const arr = models[task]
        if (Array.isArray(arr) && arr.length > 0) init[task] = arr[0]
      })
      setDefaults(init)
    } catch (e) {
      console.error(e)
      alert('Falha ao descobrir capacidades. Verifique URL e chave.')
    } finally {
      setDiscovering(false)
    }
  }

  const onSave = async () => {
    // Mapear capacidades para kinds suportados no backend
    const capToKind: Record<string, 'llm' | 'image' | 'video' | 'tts' | 'stt'> = {
      text_gen: 'llm',
      image_gen: 'image',
      video_gen: 'video',
      tts: 'tts',
      stt: 'stt',
    }
    const supported = selectedCaps.filter(c => capToKind[c])
    if (supported.length === 0) {
      alert('Selecione ao menos uma capacidade suportada (LLM, Imagem, Vídeo, TTS, STT).')
      return
    }
    for (const cap of supported) {
      const kind = capToKind[cap]
      const meta = {
        capabilities: selectedCaps,
        contexts,
        endpoints: disc?.endpoints || {},
        models: disc?.models || {},
        default_models: defaults,
      }
      await createM.mutateAsync({ name, kind, api_base: disc?.base_url || baseUrl, api_key: apiKey, meta, enabled: true })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[720px] max-w-[95vw] rounded-md shadow-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Adicionar Provider de IA</h2>
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Name</span>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="piAPI" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">API Key</span>
              <input className="input" type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="••••" />
            </label>
            <label className="flex flex-col gap-1 col-span-2">
              <span className="text-sm">Base URL</span>
              <input className="input" value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://api.sua-ia.com" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={onDiscover} disabled={discovering || !baseUrl || !apiKey}>
              {discovering ? 'Descobrindo...' : 'Descobrir capacidades'}
            </button>
            {disc && <span className="text-sm text-gray-600">Encontrado: {disc?.name}</span>}
          </div>

          <CapabilityMatrix discovered={disc?.capabilities || []} selected={selectedCaps} onChange={setSelectedCaps} />

          {disc?.models && (
            <div className="border rounded p-3">
              <h3 className="font-medium mb-2">Modelos disponíveis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Texto</label>
                  <select className="select w-full" value={defaults['text_gen'] || ''} onChange={e=>setDefaults(d=>({ ...d, text_gen: e.target.value }))}>
                    {(disc.models['text_gen'] || []).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Imagem</label>
                  <select className="select w-full" value={defaults['image_gen'] || ''} onChange={e=>setDefaults(d=>({ ...d, image_gen: e.target.value }))}>
                    {(disc.models['image_gen'] || []).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Vídeo</label>
                  <select className="select w-full" value={defaults['video_gen'] || ''} onChange={e=>setDefaults(d=>({ ...d, video_gen: e.target.value }))}>
                    {(disc.models['video_gen'] || []).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Áudio (TTS)</label>
                  <select className="select w-full" value={defaults['tts'] || ''} onChange={e=>setDefaults(d=>({ ...d, tts: e.target.value }))}>
                    {(disc.models['tts'] || []).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Áudio (STT)</label>
                  <select className="select w-full" value={defaults['stt'] || ''} onChange={e=>setDefaults(d=>({ ...d, stt: e.target.value }))}>
                    {(disc.models['stt'] || []).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Embeddings</label>
                  <select className="select w-full" value={defaults['embeddings'] || ''} onChange={e=>setDefaults(d=>({ ...d, embeddings: e.target.value }))}>
                    {(disc.models['embeddings'] || []).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Moderação</label>
                  <select className="select w-full" value={defaults['moderation'] || ''} onChange={e=>setDefaults(d=>({ ...d, moderation: e.target.value }))}>
                    {(disc.models['moderation'] || []).map((m:string)=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Os selects exibem todos os modelos retornados da API, filtrados por categoria.</p>
            </div>
          )}
          <ContextSwitches selected={contexts} onChange={setContexts} />
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSave} disabled={!name || !baseUrl || !apiKey}>Salvar</button>
        </div>
      </div>
    </div>
  )
}