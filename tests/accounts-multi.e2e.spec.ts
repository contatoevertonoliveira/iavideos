import { test, expect } from "@playwright/test"

test.describe("Multi-accounts flow", () => {
  test("selector alterna fonte de dados e desvincular remove item", async ({ page }) => {
    // Accounts list: start with 2
    await page.route("**/api/v1/accounts", async (route) => {
      const response = await route.fetch()
      // Ignore actual backend; fulfill with mocked list
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 1,
            provider: "google",
            external_user_id: "sub-1",
            display_name: "User One",
            avatar_url: "https://example.com/one.jpg",
            username: "user1@gmail.com",
            status: "active",
            scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
            expires_at: new Date(Date.now() + 3600_000).toISOString(),
          },
          {
            id: 2,
            provider: "google",
            external_user_id: "sub-2",
            display_name: "User Two",
            avatar_url: "https://example.com/two.jpg",
            username: "user2@gmail.com",
            status: "active",
            scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/youtube.readonly"],
            expires_at: new Date(Date.now() + 7200_000).toISOString(),
          },
        ]),
      })
    })

    // Channels endpoint varies by social_account_id
    await page.route("**/api/v1/channels**", async (route) => {
      const url = new URL(route.request().url)
      const saId = Number(url.searchParams.get("social_account_id") || 0)
      let data: any[] = []
      if (saId === 1) data = [
        { id: 11, name: "Feed 1A", category: "general", publish_config: { auto_publish: true } },
        { id: 12, name: "Feed 1B", category: "educacional", publish_config: { auto_publish: false } },
      ]
      if (saId === 2) data = [
        { id: 21, name: "Feed 2A", category: "general", publish_config: { auto_publish: false } },
      ]
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) })
    })

    // YouTube linked channels per social account
    await page.route("**/api/v1/accounts/*/youtube/channels", async (route) => {
      const m = route.request().url.match(/accounts\/(\d+)\/youtube\/channels/)
      const id = m ? Number(m[1]) : 0
      let data: any[] = []
      if (id === 1) data = [
        { external_id: "yt-1a", name: "Canal 1A" },
        { external_id: "yt-1b", name: "Canal 1B" },
      ]
      if (id === 2) data = [
        { external_id: "yt-2a", name: "Canal 2A" },
      ]
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) })
    })

    await page.goto("/channels")
    // Should list feeds for account 1 initially (active selection null shows loading; once selected in store or user picks, we assert switch)
    // Select account 1 then 2
    const select = page.getByLabel("Conta Google")
    await select.selectOption("1")
    await expect(page.getByText("Feed 1A")).toBeVisible()
    await expect(page.getByText("Feed 1B")).toBeVisible()

    await select.selectOption("2")
    await expect(page.getByText("Feed 2A")).toBeVisible()
    await expect(page.getByText("Feed 1A")).toHaveCount(0)

    // Unlink on Accounts - adjust accounts API to return only account 2 after unlink
    let accountsAfterUnlink = false
    await page.route("**/api/v1/accounts", async (route) => {
      if (!accountsAfterUnlink) return route.continue()
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 2,
            provider: "google",
            external_user_id: "sub-2",
            display_name: "User Two",
            avatar_url: "https://example.com/two.jpg",
            username: "user2@gmail.com",
            status: "active",
            scopes: [],
            expires_at: new Date(Date.now() + 7200_000).toISOString(),
          },
        ]),
      })
    })

    await page.route("**/api/v1/accounts/1", async (route) => {
      if (route.request().method.toUpperCase() === "DELETE") {
        accountsAfterUnlink = true
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
      }
      return route.continue()
    })

    await page.goto("/accounts")
    await expect(page.getByText("User One")).toBeVisible()
    await expect(page.getByText("User Two")).toBeVisible()
    await page.getByRole("button", { name: /Desvincular/i }).click()

    await expect(page.getByText("User One")).toHaveCount(0)
    await expect(page.getByText("User Two")).toBeVisible()
  })
})