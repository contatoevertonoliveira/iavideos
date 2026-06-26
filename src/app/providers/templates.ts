export type ProviderTemplate = {
  name: string
  header_key: string
  endpoints: Record<string, string>
  models: {
    text_gen?: string[]
    image_gen?: string[]
    video_gen?: string[]
    tts?: string[]
    stt?: string[]
    embeddings?: string[]
    moderation?: string[]
  }
}

export const DEFAULT_ENDPOINTS: Record<string, string> = {
  text_gen: '/v1/chat/completions',
  image_gen: '/v1/images',
  tts: '/v1/tts',
  stt: '/v1/stt',
  embeddings: '/v1/embeddings',
  moderation: '/v1/moderations',
  video_gen: '/v1/video',
}

// Template PiAPI: vamos preencher os modelos/endpoints aqui conforme você for fornecendo.
export const PIAPI_TEMPLATE: ProviderTemplate = {
  name: 'PiAPI',
  header_key: 'X-API-Key',
  // PiAPI usa um endpoint unificado de tasks: /api/v1/task
  endpoints: {
    // LLMs usam o endpoint de chat completions
    text_gen: '/v1/chat/completions',
    image_gen: '/api/v1/task',
    video_gen: '/api/v1/task',
    tts: '/api/v1/task',
    stt: '/api/v1/task',
    embeddings: '/api/v1/task',
    moderation: '/api/v1/task',
  },
  // Modelos conhecidos pelos docs fornecidos:
  // - Imagem: Gemini 2.5 Flash Image (model: 'gemini')
  // - Vídeo: Veo3/Veo3.1 (model: 'veo3' / 'veo3.1'), Kling (model: 'kling'), Hailuo (model: 'hailuo'), Sora2 (model: 'sora2'), WanX (model: 'Qubico/wanx')
  // - TTS: F5 TTS (model: 'Qubico/tts')
  models: {
    // LLMs disponíveis via completions
    text_gen: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'claude-3.7-sonnet-20250219', 'claude-sonnet-4-20250514', 'gemini-2.5-flash-nothinking'],
    image_gen: ['Qubico/flux1-dev', 'Qubico/flux1-schnell', 'Qubico/flux1-dev-advanced', 'Qubico/qwen-image', 'qwen-image', 'gemini', 'Qubico/joycaption'],
    video_gen: ['veo3', 'veo3.1', 'kling', 'hailuo', 'sora2', 'Qubico/wanx', 'Qubico/hunyuan', 'luma'],
    tts: [
      // Voz/Música via PiAPI
      'Qubico/tts',
      'Qubico/diffrhythm',
      'AceStep/text-to-audio',
      'ace-step-text-audio',
      'Qubico/mmaudio',
      'music-u',
      'Qubico/music-u',
    ],
    stt: [],
    embeddings: [],
    moderation: [],
  },
}

export function applyTemplateToState(
  tpl: ProviderTemplate,
  setHeaderKey: (v: string) => void,
  setDiscoveredLLM: (v: string[]) => void,
  setDiscoveredImage: (v: string[]) => void,
  setDiscoveredVideo: (v: string[]) => void,
  setDiscoveredTTS: (v: string[]) => void,
  setModelsLLM: (v: string) => void,
  setModelsImage: (v: string) => void,
  setModelsVideo: (v: string) => void,
  setModelsTTS: (v: string) => void,
  setDefaultLLM: (v: string) => void,
  setDefaultImage: (v: string) => void,
  setDefaultVideo: (v: string) => void,
  setDefaultTTS: (v: string) => void,
) {
  setHeaderKey(tpl.header_key)
  const llm = tpl.models.text_gen || []
  const image = tpl.models.image_gen || []
  const video = tpl.models.video_gen || []
  const tts = tpl.models.tts || []
  setDiscoveredLLM(llm)
  setDiscoveredImage(image)
  setDiscoveredVideo(video)
  setDiscoveredTTS(tts)
  setModelsLLM(llm.join(', '))
  setModelsImage(image.join(', '))
  setModelsVideo(video.join(', '))
  setModelsTTS(tts.join(', '))
  if (llm.length > 0) setDefaultLLM(llm[0])
  if (image.length > 0) setDefaultImage(image[0])
  if (video.length > 0) setDefaultVideo(video[0])
  if (tts.length > 0) setDefaultTTS(tts[0])
}