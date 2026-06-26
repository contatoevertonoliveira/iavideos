import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

type ThemeMode = 'light' | 'dark'
// Removido suporte a skins para evitar interferência de estilos

type ThemeContextValue = {
  mode: ThemeMode
  toggle: () => void
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialMode(): ThemeMode {
  try {
    const saved = localStorage.getItem('theme') as ThemeMode | null
    if (saved === 'light' || saved === 'dark') return saved
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode())

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    try {
      localStorage.setItem('theme', m)
    } catch {}
  }

  const toggle = () => setMode(mode === 'dark' ? 'light' : 'dark')

  // Aplica/remova a classe 'dark' no <html> para ativar variantes e tokens
  useEffect(() => {
    try {
      const root = document.documentElement
      // Garante que o tema NeuralCine esteja ativo globalmente
      root.classList.add('theme-neuralCine')
      if (mode === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
    } catch {}
  }, [mode])



  const value = useMemo(() => ({ mode, toggle, setMode }), [mode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider')
  return ctx
}