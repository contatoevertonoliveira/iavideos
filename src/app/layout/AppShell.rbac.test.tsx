import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppShell from './AppShell'
import { useAuthStore } from '@/features/auth/store'

describe('RBAC menus', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
  })

  it('superAdmin vê menu Admin', () => {
    useAuthStore.getState().setContext({ user: { id: 1, name: 'SA', email: 'sa@example.com', role: 'superAdmin' } , site: { mode: 'free' } })
    render(<MemoryRouter initialEntries={["/"]}><AppShell /></MemoryRouter>)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('viewer não vê menu Admin', () => {
    useAuthStore.getState().setContext({ user: { id: 3, name: 'Viewer', email: 'v@example.com', role: 'viewer' }, site: { mode: 'free' } })
    render(<MemoryRouter initialEntries={["/"]}><AppShell /></MemoryRouter>)
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})