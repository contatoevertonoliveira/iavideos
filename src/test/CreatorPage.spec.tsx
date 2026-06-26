import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CreatorPage from '@/features/creator/CreatorPage'

describe('CreatorPage', () => {
  it('renderiza input inicial e muda fluxo ao selecionar modo', async () => {
    render(<CreatorPage />)
    const input = screen.getByPlaceholderText(/história do jacaré/i)
    expect(input).toBeInTheDocument()

    const btnSemi = screen.getByRole('button', { name: /Semi-Automático/i })
    fireEvent.click(btnSemi)

    // Deve renderizar o fluxo semi
    const heading = await screen.findByText(/Roteiro Semi-Automático/i)
    expect(heading).toBeInTheDocument()
  })
})