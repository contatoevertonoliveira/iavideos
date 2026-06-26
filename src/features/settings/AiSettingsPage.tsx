import React, { useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import AiParameterSlider from './components/AiParameterSlider'
import ToggleField from './components/ToggleField'
import SelectField from './components/SelectField'

export default function AiSettingsPage() {
  const { loadAll, ai, updateAi, loading } = useSettings()
  const [local, setLocal] = useState<any>(ai)
  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { setLocal(ai) }, [ai])

  const save = async () => {
    await updateAi(local)
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">IA & Automações</h1>
      {loading ? <div>Carregando…</div> : (
        <div className="grid gap-4">
          <SelectField label="Modelo IA" value={local?.model || ''} onChange={(v) => setLocal({ ...local, model: v })} options={[
            { value: 'gpt-5', label: 'OpenAI GPT-5' },
            { value: 'claude-3-5', label: 'Claude 3.5' },
            { value: 'gemini-2', label: 'Gemini 2' },
          ]} />

          <AiParameterSlider label="Temperatura criativa" value={local?.temperature || 0.5} min={0} max={1} step={0.01} onChange={(v) => setLocal({ ...local, temperature: v })} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ToggleField label="Auto-tags" checked={!!local?.auto_tags} onChange={(v) => setLocal({ ...local, auto_tags: v })} />
            <ToggleField label="Auto-schedule" checked={!!local?.auto_schedule} onChange={(v) => setLocal({ ...local, auto_schedule: v })} />
            <ToggleField label="Auto-repost" checked={!!local?.auto_repost} onChange={(v) => setLocal({ ...local, auto_repost: v })} />
          </div>

          <div>
            <button className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm" onClick={save}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  )
}