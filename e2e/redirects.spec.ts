// Prova o contrato de FE-4 (PR 4d): /dashboard/* aposentado em favor de
// /clientes, /simulador, /simulacoes. `redirects()` em next.config.ts roda
// ANTES do proxy (docs Next 16) — não depende de sessão nem do bypass de
// auth, então este spec não usa mockEngine nem asserta conteúdo de página.
import { expect, test } from "@playwright/test"

test("redireciona /dashboard para /simulador", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/simulador$/)
})

test("redireciona /dashboard/history para /simulacoes", async ({ page }) => {
  await page.goto("/dashboard/history")
  await expect(page).toHaveURL(/\/simulacoes$/)
})

test("redireciona /dashboard/companies para /clientes", async ({ page }) => {
  await page.goto("/dashboard/companies")
  await expect(page).toHaveURL(/\/clientes$/)
})
