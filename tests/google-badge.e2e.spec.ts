import { test, expect } from "@playwright/test";

test("mostra avatar/nome após conectar Google e persiste no reload", async ({ page }) => {
  // 1) Abre app
  await page.goto("http://localhost:5175");

  // 2) Navega para Configurações/Contas (ajuste a rota)
  await page.goto("http://localhost:5175/configuracoes/contas");

  // 3) Intercepta /exchange antes do clique
  await page.route("**/auth/google/exchange", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "ACCESS_E2E",
        refresh_token: "REFRESH_E2E",
        user: { name: "Everton Oliveira", picture: "https://example.com/e2e.jpg", email: "e@e.com" },
      }),
    });
  });

  // 4) Clica no botão "Conectar com Google"
  const btn = page.getByRole("button", { name: /Conectar com Google/i });
  await btn.click();

  // 5) Verifica toast de sucesso (se tiver) e badge no topo
  const badge = page.locator("text=Google");
  await expect(badge).toBeVisible();
  await expect(page.locator("text=Everton Oliveira")).toBeVisible();

  // 6) Reload → deve continuar visível (persistência no store)
  await page.reload();
  await expect(page.locator("text=Everton Oliveira")).toBeVisible();

  // 7) (Opcional) Deslogar → badge some
  // clique em "Sair" se existir
  // await page.getByRole("button", { name: /Sair/i }).click();
  // await expect(page.locator("text=Google")).toHaveCount(0);
});