import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import Accounts from "./Accounts"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/mocks/server"
import { http, HttpResponse } from "msw"

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe("Accounts page", () => {
  it("renderiza duas contas Google conectadas", async () => {
    renderWithProviders(<Accounts />)
    // Espera pelas linhas com os nomes mockados
    expect(await screen.findByText("User One")).toBeInTheDocument()
    expect(await screen.findByText("User Two")).toBeInTheDocument()
  })

  it("Desvincular remove o item da UI", async () => {
    // Primeiro GET retorna 2 contas
    server.use(
      http.get("http://localhost:8000/api/v1/accounts", async () => {
        return HttpResponse.json([
          {
            id: 1,
            provider: "google",
            external_user_id: "sub-1",
            display_name: "User One",
            avatar_url: "https://example.com/one.jpg",
            username: "user1@gmail.com",
            status: "active",
            scopes: [],
            expires_at: new Date(Date.now() + 1000_000).toISOString(),
          },
          {
            id: 2,
            provider: "google",
            external_user_id: "sub-2",
            display_name: "User Two",
            avatar_url: "https://example.com/two.jpg",
            username: "user2@gmail.com",
            status: "active",
            scopes: [],
            expires_at: new Date(Date.now() + 2000_000).toISOString(),
          },
        ])
      })
    )

    renderWithProviders(<Accounts />)
    expect(await screen.findByText("User One")).toBeInTheDocument()
    expect(await screen.findByText("User Two")).toBeInTheDocument()

    // Após DELETE, próximo GET deve retornar apenas a conta 2
    server.use(
      http.get("http://localhost:8000/api/v1/accounts", async () => {
        return HttpResponse.json([
          {
            id: 2,
            provider: "google",
            external_user_id: "sub-2",
            display_name: "User Two",
            avatar_url: "https://example.com/two.jpg",
            username: "user2@gmail.com",
            status: "active",
            scopes: [],
            expires_at: new Date(Date.now() + 2000_000).toISOString(),
          },
        ])
      })
    )

    // Clica no botão "Desvincular" da primeira linha
    const unlinkBtns = await screen.findAllByRole("button", { name: /Desvincular/i })
    await userEvent.click(unlinkBtns[0])

    await waitFor(async () => {
      expect(screen.queryByText("User One")).toBeNull()
      expect(screen.getByText("User Two")).toBeInTheDocument()
    })
  })
})