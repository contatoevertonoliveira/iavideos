import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginLocal from './LoginLocal'
import { useAuthStore } from './store'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'

function AppStub() {
  return (
    <Routes>
      <Route path="/login" element={<LoginLocal />} />
      <Route path="/admin" element={<div>ADMIN</div>} />
      <Route path="/dashboard" element={<div>DASHBOARD</div>} />
    </Routes>
  )
}

describe('LoginLocal', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
  })

  it('submete credenciais válidas e redireciona por role (superAdmin → /admin)', async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppStub />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'everoliver@example.com' } })
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))

    await waitFor(() => {
      expect(screen.queryByText('ADMIN')).toBeInTheDocument()
    })

    const s = useAuthStore.getState()
    expect(s.access).toBeTruthy()
    expect(s.ctx?.user?.role).toBeDefined()
  })

  it('submete credenciais válidas e redireciona por role (moderator → /dashboard)', async () => {
    // Force /me/context to return moderator
    server.use(
      http.get('*/me/context', async () => {
        return HttpResponse.json({ id: 2, name: 'Mod', email: 'everoliver02@example.com', role: 'moderator' })
      })
    )
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppStub />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'everoliver02@example.com' } })
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))

    await waitFor(() => {
      expect(screen.queryByText('DASHBOARD')).toBeInTheDocument()
    })
  })

  it('erro 401 mostra mensagem de erro', async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppStub />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/i }))

    await waitFor(() => {
      expect(screen.getByText(/Erro ao entrar|unauthorized/i)).toBeInTheDocument()
    })
  })
})