import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

type Kind = 'llm' | 'image' | 'video' | 'tts' | 'stt' | 'audio'

type Provider = {
  id: number
  name: string
  kind: Kind
  enabled: boolean
  meta?: any
}

export type ModelOption = { value: string; label: string; kind: Kind }

export function usePiModels() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [providers, setProviders] = useState<Record<string, Provider[]>>({})
  const [defaults, setDefaults] = useState<Record<string, number | null>>({ llm: null, image: null, video: null, tts: null })

  useEffect(() => {
    let mounted = true
    async function fetchAll() {
      setLoading(true)
      setError(null)
      try {
        const settings = await api.get('/settings')
        const s = settings.data || {}
        const defMap: Record<string, number | null> = {
          llm: s.llm_provider_id || null,
          image: s.image_provider_id || null,
          video: s.video_provider_id || null,
          tts: s.tts_provider_id || null,
        }
        // Buscar provedores por kind conhecido no backend.
        // Áudio usa provedores 'tts' no backend; incluiremos a agregação no getModelsForKind.
        const kinds: Kind[] = ['llm','image','video','tts']
        const providersByKind: Record<string, Provider[]> = {}
        await Promise.all(kinds.map(async (k) => {
          const res = await api.get(`/providers?kind=${k}`)
          providersByKind[k] = (res.data?.providers || res.data || []).filter((p: Provider) => p.enabled)
        }))
        if (!mounted) return
        setProviders(providersByKind)
        setDefaults(defMap)
      } catch (e: any) {
        setError(String(e?.message || e))
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    return () => { mounted = false }
  }, [])

  const TASK_KEY_BY_KIND: Record<Kind, string> = {
    llm: 'text_gen',
    image: 'image_gen',
    video: 'video_gen',
    tts: 'tts',
    stt: 'stt',
    audio: 'tts',
  }

  const globalModels: ModelOption[] = useMemo(() => {
    const out: ModelOption[] = []
    for (const k of Object.keys(providers)) {
      const arr = providers[k]
      for (const p of arr) {
        const modelsObj = p.meta?.models || p.meta?.models_by_task || p.meta?.models
        // Se meta.models for um array de nomes, normaliza
        if (Array.isArray(modelsObj)) {
          for (const name of modelsObj as any[]) {
            out.push({ value: String(name), label: `${p.name} · ${String(name)}`, kind: p.kind })
          }
          continue
        }
        // Se for um objeto por task, acumula todos os nomes
        if (modelsObj && typeof modelsObj === 'object') {
          const taskKeys = Object.keys(modelsObj)
          for (const tk of taskKeys) {
            const arrNames = (modelsObj as Record<string, any>)[tk]
            if (Array.isArray(arrNames)) {
              for (const name of arrNames as any[]) {
                out.push({ value: String(name), label: `${p.name} · ${String(name)}`, kind: p.kind })
              }
            }
          }
        }
      }
    }
    return out
  }, [providers])

  function getModelsForKind(kind: Kind): ModelOption[] {
    // Em alguns setups, os modelos por task podem estar em providers de outro kind.
    // Para robustez, percorremos TODOS os providers e coletamos pela task desejada.
    const allProviders: Provider[] = Object.values(providers).flat()

    const out: ModelOption[] = []
    const taskKey = TASK_KEY_BY_KIND[kind]

    for (const p of allProviders) {
      const modelsObj = p.meta?.models || p.meta?.models_by_task || p.meta?.models

      // Caso meta.models seja um array simples de nomes
      if (Array.isArray(modelsObj)) {
        for (const name of modelsObj as any[]) {
          out.push({ value: String(name), label: `${p.name} · ${String(name)}`, kind })
        }
        continue
      }

      // Objeto por tarefa: considerar chaves alternativas
      if (modelsObj && typeof modelsObj === 'object') {
        const collected: any[] = []
        const byTask = (modelsObj as Record<string, any>)[taskKey]
        if (Array.isArray(byTask)) collected.push(...byTask)

        // Fallback por kind direto (ex.: 'image' ao invés de 'image_gen')
        const byKind = (modelsObj as Record<string, any>)[kind as string]
        if (Array.isArray(byKind)) collected.push(...byKind)

        // Áudio: alguns provedores podem expor chave 'audio'
        if (kind === 'audio') {
          const audioKeyArr = (modelsObj as Record<string, any>)['audio']
          if (Array.isArray(audioKeyArr)) collected.push(...audioKeyArr)
        }

        // Normaliza e remove duplicados para este provider
        for (const name of collected) {
          const value = String(name)
          if (!out.some((m) => m.value === value && m.kind === kind)) {
            out.push({ value, label: `${p.name} · ${value}`, kind })
          }
        }
      }

      // Fallback: incluir default_model se existir e não presente
      const def = p.meta?.default_model
      if (def && !out.some((m) => m.value === String(def) && m.kind === kind)) {
        out.push({ value: String(def), label: `${p.name} · ${String(def)}`, kind })
      }
    }

    return out
  }

  return { loading, error, providers, defaults, globalModels, getModelsForKind }
}