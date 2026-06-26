import axios from 'axios'
import { useAuthStore } from '@/features/auth/store'

const baseURL = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL,
  timeout: 60000,
})

// Anexa Authorization Bearer automaticamente quando houver token
api.interceptors.request.use((config) => {
  try {
    const token = useAuthStore.getState().access || useAuthStore.getState().accessToken
    if (token) {
      config.headers = config.headers ?? {}
      // Não sobrescrever se já estiver presente
      if (!('Authorization' in config.headers)) {
        (config.headers as any).Authorization = `Bearer ${token}`
      }
    }
  } catch (_) {
    // silencioso: store pode não estar inicializado em alguns contextos de teste
  }
  return config
})

api.interceptors.response.use(
  (resp) => resp,
  (err) => {
    const msg = err?.response?.data?.detail || err.message
    console.error('[API] Error:', msg)
    return Promise.reject(err)
  }
)