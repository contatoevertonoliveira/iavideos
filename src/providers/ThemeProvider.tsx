// Provedor de tema e hook compatível com componentes existentes
import React from 'react'
import { ThemeProvider as RawThemeProvider, useThemeMode } from '@/styles/ThemeProvider'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <RawThemeProvider>{children}</RawThemeProvider>
}

// Hook compatível: expõe { theme, toggle, setTheme } usando ThemeProvider de styles
export function useTheme() {
  const { mode, toggle, setMode } = useThemeMode()
  return {
    theme: mode,
    toggle,
    setTheme: (m: 'light' | 'dark') => setMode(m),
  }
}