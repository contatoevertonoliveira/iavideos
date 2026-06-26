import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(undefined)

function getInitialMode() {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode())

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    try { localStorage.setItem('theme', mode) } catch {}
    // transição suave opcional
    root.classList.add('theme-transition')
    const t = setTimeout(() => root.classList.remove('theme-transition'), 450)
    return () => clearTimeout(t)
  }, [mode])

  const value = useMemo(() => ({ mode, toggle, setMode }), [mode])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return { theme: ctx.mode, toggle: ctx.toggle, setTheme: ctx.setMode }
}