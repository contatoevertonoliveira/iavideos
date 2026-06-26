import { test, expect } from "@playwright/test";

const PAGE_URL = "http://localhost:5175/configuracoes/contas";

test.describe("Google User Badge E2E", () => {
  test("shows badge with photo and name from persisted store", async ({ page }) => {
    const persisted = JSON.stringify({
      state: {
        access: "tokenA",
        refresh: "tokenR",
        user: {
          name: "Ana Testadora",
          picture: "https://via.placeholder.com/64",
          email: "ana@example.com",
        },
      },
    });
    await page.addInitScript(([key, value]) => {
      localStorage.setItem(key, value as string);
    }, ["av-auth", persisted]);

    await page.goto(PAGE_URL);

    await expect(page.getByText("Ana Testadora")).toBeVisible();
    await expect(page.getByText("Google")).toBeVisible();
    await expect(page.locator('img[alt="Ana Testadora"]')).toBeVisible();
  });

  test("badge disappears after logout (clear persistence)", async ({ page }) => {
    const persisted = JSON.stringify({
      state: { access: "x", refresh: "y", user: { name: "Logout User", picture: null, email: null } },
    });
    await page.addInitScript(([key, value]) => {
      localStorage.setItem(key, value as string);
    }, ["av-auth", persisted]);

    await page.goto(PAGE_URL);
    await expect(page.getByText("Logout User")).toBeVisible();
    // simulate logout by clearing persistence
    await page.evaluate(() => window.localStorage.removeItem("av-auth"));
    await page.reload();
    await expect(page.getByText("Google")).toHaveCount(0);
  });

  test("shows initials when no picture is set", async ({ page }) => {
    const persisted = JSON.stringify({
      state: { access: "a", refresh: "r", user: { name: "Carlos Eduardo", picture: null, email: null } },
    });
    await page.addInitScript(([key, value]) => {
      localStorage.setItem(key, value as string);
    }, ["av-auth", persisted]);

    await page.goto(PAGE_URL);
    // Initials CE should be visible in the badge
    await expect(page.getByText("Carlos Eduardo")).toBeVisible();
    await expect(page.getByText("Google")).toBeVisible();
    await expect(page.getByText("CE")).toBeVisible();
    // and no image for that user
    await expect(page.locator('img[alt="Carlos Eduardo"]')).toHaveCount(0);
  });
});