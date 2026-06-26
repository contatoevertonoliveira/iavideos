import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '@/mocks/server'
import { http, HttpResponse } from 'msw'
import AiSettingsPage from './AiSettingsPage'

function wrapper(ui: React.ReactElement) {
  const qc = new QueryClient()
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/settings/ai"]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AiSettingsPage', () => {
  it('altera slider/checkboxes e persiste via PATCH', async () => {
    const user = userEvent.setup()
    let patchBody: any = null
    server.use(
      http.patch('*/api/v1/settings/ai', async ({ request }) => {
        patchBody = await request.json()
        return HttpResponse.json({ ok: true })
      })
    )

    render(wrapper(<AiSettingsPage />))

    // Aguarda slider presente
    const slider = await screen.findByRole('slider')
    // Define valor aproximado (0.9) – sliders de input range usam 0-1
    await user.clear(slider)
    await user.type(slider as any, '0.9')

    // Toggle auto-tags
    const autoTagsToggle = screen.getByLabelText(/Auto-tags/i)
    await user.click(autoTagsToggle)

    // Salvar
    const saveBtn = screen.getByRole('button', { name: /salvar/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(patchBody).toBeTruthy()
      expect(patchBody.temperature).toBeDefined()
    })
  })
})