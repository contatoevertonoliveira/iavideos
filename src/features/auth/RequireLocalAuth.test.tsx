import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireLocalAuth from './RequireLocalAuth'
import LoginLocal from './LoginLocal'
import { useAuthStore } from './store'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'

describe('RequireLocalAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
  })

  it('sem token redireciona para /login', async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<LoginLocal />} />
          <Route path="/dashboard" element={<RequireLocalAuth><div>OK</div></RequireLocalAuth>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/Entrar/i)).toBeInTheDocument()
    })
  })

  it('com token e /me/context role=moderator, renderiza conteúdo', async () => {
    useAuthStore.getState().setTokens({ access: 'ACCESS', refresh: 'REFRESH' })
    server.use(http.get('*/me/context', async () => HttpResponse.json({ id: 2, name: 'Mod', email: 'mod@example.com', role: 'moderator' })))
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<RequireLocalAuth><div>OK</div></RequireLocalAuth>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument()
    })
  })
})