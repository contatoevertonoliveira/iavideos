import { test, expect } from '@playwright/test'

test.describe('F10 - Autenticação Local + Gates', () => {
  test('acessar /dashboard sem login redireciona para /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: /Entrar/i })).toBeVisible()
  })

  test('logar superAdmin (everoliver) redireciona para /admin e toggle ON em billing', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('everoliver@example.com')
    await page.getByLabel('Senha').fill('123456')
    await page.getByRole('button', { name: /Continuar/i }).click()
    await page.waitForURL('**/admin')
    // Ir para billing para verificar o toggle ON
    await page.goto('/admin/billing')
    await expect(page.getByText(/Site gratuito/i)).toBeVisible()
  })

  test('tentar criar post sem contas conectadas abre modal e CTA leva a /configuracoes/contas', async ({ page }) => {
    // Garantir login básico
    await page.goto('/login')
    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Senha').fill('123456')
    await page.getByRole('button', { name: /Continuar/i }).click()
    await page.waitForURL('**/dashboard')
    // Ir para criação
    await page.goto('/posts/new')
    await expect(page.getByText(/Conecte suas contas para publicar/i)).toBeVisible()
    await page.getByRole('button', { name: /Conectar agora/i }).click()
    await page.waitForURL('**/configuracoes/contas')
  })
})