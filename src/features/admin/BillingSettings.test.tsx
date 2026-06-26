import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BillingSettings from './BillingSettings'
import { useAuthStore } from '@/features/auth/store'

describe('BillingSettings', () => {
  it('altera site_mode e UI reflete banner/label adequado', async () => {
    useAuthStore.getState().setContext({ user: { id: 1, name: 'SA', email: 'sa@example.com', role: 'superAdmin' }, site: { mode: 'free' } })
    render(<MemoryRouter><BillingSettings /></MemoryRouter>)
    expect(screen.getByText(/Site gratuito/i)).toBeInTheDocument()
    expect(screen.getByText(/Modo atual do site: Gratuito/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ON|OFF/i }))
    await waitFor(() => {
      expect(screen.getByText(/Modo atual do site: Assinantes/i)).toBeInTheDocument()
    })
  })
})