import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Props = { provider: { id: number; kind: string; meta?: any } }

export default function TestConsole({ provider }: Props) {
  const [task, setTask] = useState<string>('text_gen')
  const [model, setModel] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const modelsForTask: string[] = (provider?.meta?.models?.[task] || [])

  useEffect(() => {
    if (modelsForTask.length > 0) {
      setModel(prev => prev || modelsForTask[0])
    }
  }, [task, provider?.id])

  const onSend = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post(`/ai/providers/test`, { provider_id: provider.id, task, model, prompt })
      setResult(res.data)
    } catch (e: any) {
      setResult({ error: e?.message || String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-cine rounded p-3 space-y-2 bg-cine-surface-90 text-cine">
      <h3 className="font-medium">Testar Provider</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-cine-muted">Task</label>
          <select className="w-full px-2 py-1 text-sm rounded bg-cine-surface border border-cine text-cine" value={task} onChange={e=>{
            const t = e.target.value
            setTask(t)
            const arr = (provider?.meta?.models?.[t] || []) as string[]
            if (arr.length > 0) setModel(arr[0])
          }}>
            <option value="text_gen">text_gen</option>
            <option value="image_gen">image_gen</option>
            <option value="video_gen">video_gen</option>
            <option value="tts">tts</option>
            <option value="stt">stt</option>
            <option value="embeddings">embeddings</option>
            <option value="moderation">moderation</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-cine-muted">Modelo (opcional)</label>
          {modelsForTask.length > 0 ? (
            <select className="w-full px-2 py-1 text-sm rounded bg-cine-surface border border-cine text-cine" value={model} onChange={e=>setModel(e.target.value)}>
              {modelsForTask.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <input className="w-full px-2 py-1 text-sm rounded bg-cine-surface border border-cine text-cine" value={model} onChange={e=>setModel(e.target.value)} placeholder="ex.: pi-gpt-creative" />
          )}
        </div>
      </div>
      <textarea className="w-full px-2 py-1 text-sm rounded bg-cine-surface border border-cine text-cine" rows={4} placeholder="Digite um prompt ou parâmetros" value={prompt} onChange={e=>setPrompt(e.target.value)} />
      <div className="flex gap-2">
        <button className="px-3 py-1.5 rounded-md gradient-cine text-white shadow-cine hover-cine disabled:opacity-60" onClick={onSend} disabled={loading || !prompt}>{loading ? 'Enviando...' : 'Enviar'}</button>
      </div>
      {result && <pre className="text-xs bg-cine-surface p-2 rounded overflow-auto border border-cine">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  )
}