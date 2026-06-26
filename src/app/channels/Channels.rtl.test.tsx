import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import userEvent from "@testing-library/user-event"
import Channels from "./Channels"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useLinkedAccountsStore } from "@/features/accounts/linkedStore"

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient()
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </MemoryRouter>
  )
}

describe("Channels page", () => {
  it("Selector de conta ativa altera a fonte de dados", async () => {
    // Seed store with two Google accounts and set active to 1
    useLinkedAccountsStore.setState({
      accounts: [
        { id: 1, provider: "google", status: "active", display_name: "User One" } as any,
        { id: 2, provider: "google", status: "active", display_name: "User Two" } as any,
      ],
      activeByProvider: { google: 1 },
      fetchAccounts: useLinkedAccountsStore.getState().fetchAccounts,
      link: useLinkedAccountsStore.getState().link,
      unlink: useLinkedAccountsStore.getState().unlink,
      refresh: useLinkedAccountsStore.getState().refresh,
      setActive: useLinkedAccountsStore.getState().setActive,
    })

    renderWithProviders(<Channels />)

    // Deve carregar feeds para social_account_id=1
    expect(await screen.findByText("Feed 1A")).toBeInTheDocument()
    expect(screen.getByText("Feed 1B")).toBeInTheDocument()

    const selector = screen.getByLabelText("Conta Google") as HTMLSelectElement
    await userEvent.selectOptions(selector, "2")

    // Deve trocar para feeds da conta 2
    expect(await screen.findByText("Feed 2A")).toBeInTheDocument()
    expect(screen.queryByText("Feed 1A")).toBeNull()
  })
})