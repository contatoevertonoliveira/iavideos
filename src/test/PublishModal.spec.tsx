import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PublishModal from '@/features/creator/components/PublishModal'
import { useCreatorStore } from '@/features/creator/useCreatorStore'
import { MemoryRouter } from 'react-router-dom'

describe('PublishModal', () => {
  it('bloqueia publicação se sem redes conectadas e mostra CTA', () => {
    const { setConnectedPlatforms } = useCreatorStore.getState()
    setConnectedPlatforms([])
    render(
      <MemoryRouter>
        <PublishModal open={true} onClose={() => {}} />
      </MemoryRouter>
    )

    const alert = screen.getByText(/Para publicar, conecte uma conta primeiro/i)
    expect(alert).toBeInTheDocument()

    const publicar = screen.getByRole('button', { name: /Publicar/i })
    expect(publicar).toBeDisabled()

    const link = screen.getByText(/Conectar Contas/i)
    expect(link).toHaveAttribute('href', '/configuracoes/contas')
  })
})