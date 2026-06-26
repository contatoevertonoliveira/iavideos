import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import IntegrationsPage from './IntegrationsPage'

function wrapper(ui: React.ReactElement) {
  const qc = new QueryClient()
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/settings/integrations"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('IntegrationsPage', () => {
  it('renderiza cards mockados e dispara reconectar/revogar', async () => {
    const user = userEvent.setup()
    let reconnectCalled: string | null = null
    let revokeCalled: string | null = null
    server.use(
      http.post('*/api/v1/settings/integrations/:provider/reconnect', async ({ params }) => {
        reconnectCalled = String(params.provider)
        return HttpResponse.json({ ok: true })
      }),
      http.delete('*/api/v1/settings/integrations/:provider/revoke', async ({ params }) => {
        revokeCalled = String(params.provider)
        return HttpResponse.json({ ok: true })
      }),
    )

    render(wrapper(<IntegrationsPage />))

    // Aguarda providers renderizados
    await waitFor(() => {
      expect(screen.getByText(/google/i)).toBeInTheDocument()
      expect(screen.getByText(/facebook/i)).toBeInTheDocument()
      expect(screen.getByText(/tiktok/i)).toBeInTheDocument()
    })

    // Reconectar Google
    const googleCard = screen.getByText(/google/i).closest('div')!
    const reconnectBtn = screen.getAllByRole('button', { name: /reconectar/i })[0]
    await user.click(reconnectBtn)

    // Revogar TikTok
    const revokeBtns = screen.getAllByRole('button', { name: /revogar/i })
    const tiktokRevoke = revokeBtns.find((btn) => btn.parentElement?.previousSibling?.querySelector('.font-medium')?.textContent?.toLowerCase() === 'tiktok') || revokeBtns[0]
    await user.click(tiktokRevoke)

    await waitFor(() => {
      expect(reconnectCalled).toBeTruthy()
      expect(revokeCalled).toBeTruthy()
    })
  })
})