import React from 'react'
import { Outlet } from 'react-router-dom'

export default function ThemeGuestLayout() {
  return (
    <div className="min-h-screen bg-[var(--cine-bg)]">
      <React.Suspense fallback={<div className="text-[var(--cine-text-muted)] p-6">Carregando…</div>}>
        <Outlet />
      </React.Suspense>
    </div>
  )
}