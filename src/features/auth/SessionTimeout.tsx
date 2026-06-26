import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from './store'

interface Props {
  timeoutMs?: number
}

export default function SessionTimeout({ timeoutMs = 20 * 60 * 1000 }: Props) {
  const nav = useNavigate()
  const clear = useAuthStore((s) => s.clear)
  const access = useAuthStore((s) => s.access)

  React.useEffect(() => {
    if (!access) return
    let timer: number | undefined
    const reset = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        // Expira sessão por inatividade
        try { clear() } catch (_) {}
        nav('/login', { replace: true })
      }, timeoutMs)
    }

    const onActivity = () => reset()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') reset()
    }

    // Eventos de atividade comuns
    window.addEventListener('mousemove', onActivity)
    window.addEventListener('keydown', onActivity)
    window.addEventListener('click', onActivity)
    window.addEventListener('scroll', onActivity)
    window.addEventListener('touchstart', onActivity)
    document.addEventListener('visibilitychange', onVisibility)

    // Inicia contador
    reset()

    return () => {
      if (timer) window.clearTimeout(timer)
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('click', onActivity)
      window.removeEventListener('scroll', onActivity)
      window.removeEventListener('touchstart', onActivity)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [access, clear, nav, timeoutMs])

  return null
}