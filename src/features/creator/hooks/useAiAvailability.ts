import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

type Availability = {
  loading: boolean
  ok: boolean
  missing: Array<'llm' | 'image' | 'video' | 'tts'>
}

export function useAiAvailability(): Availability {
  const [state, setState] = useState<Availability>({ loading: true, ok: true, missing: [] })

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        const [settingsRes, llmRes, imageRes, videoRes, ttsRes] = await Promise.all([
          api.get('/settings'),
          api.get('/providers', { params: { kind: 'llm' } }),
          api.get('/providers', { params: { kind: 'image' } }),
          api.get('/providers', { params: { kind: 'video' } }),
          api.get('/providers', { params: { kind: 'tts' } }),
        ])
        const settings = settingsRes.data || {}
        const hasLLM = !!settings.llm_provider_id || (llmRes.data || []).some((p: any) => p.enabled)
        const hasImage = !!settings.image_provider_id || (imageRes.data || []).some((p: any) => p.enabled)
        const hasVideo = !!settings.video_provider_id || (videoRes.data || []).some((p: any) => p.enabled)
        const hasTTS = !!settings.tts_provider_id || (ttsRes.data || []).some((p: any) => p.enabled)
        const missing: Availability['missing'] = []
        if (!hasLLM) missing.push('llm')
        // image/video/tts são opcionais para alguns fluxos, mas avisamos se faltam
        if (!hasImage) missing.push('image')
        if (!hasVideo) missing.push('video')
        if (!hasTTS) missing.push('tts')
        if (mounted) setState({ loading: false, ok: missing.length === 0 || hasLLM, missing })
      } catch (e) {
        if (mounted) setState({ loading: false, ok: false, missing: ['llm'] })
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  return state
}