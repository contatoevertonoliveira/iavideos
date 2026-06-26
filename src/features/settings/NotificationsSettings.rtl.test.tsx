import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import NotificationsSettings from './NotificationsSettingsPage'

function wrapper(ui: React.ReactElement) {
  const qc = new QueryClient()
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/settings/notifications"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('NotificationsSettings', () => {
  it('ativa/desativa tipos e salva', async () => {
    const user = userEvent.setup()
    let patchBody: any = null
    server.use(
      http.patch('*/api/v1/settings/notifications', async ({ request }) => {
        patchBody = await request.json()
        return HttpResponse.json({ ok: true })
      })
    )

    render(wrapper(<NotificationsSettings />))

    const toggle = await screen.findByLabelText(/New Follower/i)
    await user.click(toggle)

    const saveBtn = screen.getByRole('button', { name: /salvar/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(patchBody).toBeTruthy()
    })
  })
})