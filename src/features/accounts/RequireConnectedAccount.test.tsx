import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireConnectedAccount from './RequireConnectedAccount'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'

function CreateStub() {
  return <div>
    <h1>Criar Post</h1>
  </div>
}

describe('RequireConnectedAccount', () => {
  it('com contas vazias abre modal lembrete', async () => {
    server.use(http.get('*/api/v1/accounts', async () => HttpResponse.json([])))
    render(
      <MemoryRouter initialEntries={["/posts/new"]}>
        <Routes>
          <Route path="/posts/new" element={<RequireConnectedAccount><CreateStub /></RequireConnectedAccount>} />
        </Routes>
      </MemoryRouter>
    )
    const modalText = await screen.findByText(/Conecte suas contas para publicar/i)
    expect(modalText).toBeInTheDocument()
  })

  it('com ao menos uma conta não exibe modal e permite seguir', async () => {
    render(
      <MemoryRouter initialEntries={["/posts/new"]}>
        <Routes>
          <Route path="/posts/new" element={<RequireConnectedAccount><CreateStub /></RequireConnectedAccount>} />
        </Routes>
      </MemoryRouter>
    )
    expect(await screen.findByText('Criar Post')).toBeInTheDocument()
    expect(screen.queryByText(/Conecte suas contas/i)).not.toBeInTheDocument()
  })
})