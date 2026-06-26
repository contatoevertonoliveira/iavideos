import { api } from './api'

export type AiTask = 'text_gen'|'image_gen'|'video_gen'|'tts'|'stt'|'embeddings'|'moderation'

const FALLBACK_MODEL: Record<AiTask, string | undefined> = {
  text_gen: 'gpt-4o-mini',
  image_gen: 'Qubico/flux1-dev',
  video_gen: 'kling',
  tts: 'kling',
  stt: undefined,
  embeddings: undefined,
  moderation: undefined,
}

export async function aiClient(task: AiTask, payload: any, opts?: { context?: string; model?: string }) {
  const model = opts?.model ?? FALLBACK_MODEL[task]
  const params = { ...payload }
  // Fallback específico: som via Kling requer task_type "sound"
  if (task === 'tts' && (model === 'kling') && !params.task_type) {
    params.task_type = 'sound'
  }
  const body: any = { task, prompt: payload?.prompt, params, model, context: opts?.context }
  const res = await api.post('/ai/providers/task', body)
  return res.data
}