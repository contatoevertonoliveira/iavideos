import React, { useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import SelectField from './components/SelectField'

export default function PreferencesPage() {
  const { loadAll, preferences, updatePreferences, loading } = useSettings()
  const [local, setLocal] = useState<any>(preferences)
  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { setLocal(preferences) }, [preferences])

  const save = async () => { await updatePreferences(local) }

  const lang = (local?.language || 'pt-BR') as 'pt-BR' | 'en'
  const T = {
    title: { 'pt-BR': 'Preferências Gerais', en: 'General Preferences' },
    language: { 'pt-BR': 'Idioma', en: 'Language' },
    theme: { 'pt-BR': 'Tema', en: 'Theme' },
    layout: { 'pt-BR': 'Layout', en: 'Layout' },
    timezone: { 'pt-BR': 'Fuso horário', en: 'Time zone' },
    save: { 'pt-BR': 'Salvar', en: 'Save' },
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">{T.title[lang]}</h1>
      {loading ? <div>Carregando…</div> : (
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label={T.language[lang]} value={local?.language || 'pt-BR'} onChange={(v) => setLocal({ ...local, language: v })} options={[{ value: 'pt-BR', label: 'Português (Brasil)' }, { value: 'en', label: 'English' }]} />
            <SelectField label={T.theme[lang]} value={local?.theme || 'auto'} onChange={(v) => setLocal({ ...local, theme: v })} options={[{ value: 'light', label: lang === 'en' ? 'Light' : 'Claro' }, { value: 'dark', label: lang === 'en' ? 'Dark' : 'Escuro' }, { value: 'auto', label: lang === 'en' ? 'Auto' : 'Auto' }]} />
            <SelectField label={T.layout[lang]} value={local?.dashboard_layout || 'classic'} onChange={(v) => setLocal({ ...local, dashboard_layout: v })} options={[{ value: 'classic', label: lang === 'en' ? 'Classic' : 'Clássico' }, { value: 'analytical', label: lang === 'en' ? 'Analytical' : 'Analítico' }, { value: 'compact', label: lang === 'en' ? 'Compact' : 'Compacto' }]} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">{T.timezone[lang]}</label>
              <input className="w-full bg-transparent border border-white/20 rounded px-2 py-1" value={local?.timezone || ''} onChange={(e) => setLocal({ ...local, timezone: e.target.value })} />
            </div>
          </div>
          <div>
            <button className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-sm" onClick={save}>{T.save[lang]}</button>
          </div>
        </div>
      )}
    </div>
  )
}