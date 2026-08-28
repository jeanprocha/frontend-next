// Etapa M/PR 9 — "feat(waitlist): captura real". Substitui o CTA morto da
// landing antiga (um <span> não clicável) por um formulário real na seção
// "O que está incluído" (#planos): POST /waitlist grava o e-mail (tabela
// dedicada, docs/migrations/010_waitlist.sql) e a UI mostra sucesso/erro.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"

test("waitlist: e-mail é enviado e a UI confirma sem prometer prazo", async ({ page }) => {
  const engine = await mockEngine(page)

  await page.goto("/")

  const emailInput = page.getByPlaceholder("seu@email.com")
  await emailInput.scrollIntoViewIfNeeded()
  await emailInput.fill("consultor@escritorio.com.br")
  await page.getByRole("button", { name: "Entrar na lista de espera" }).click()

  const success = page.getByRole("status").filter({ hasText: "Você está na lista." })
  await expect(success).toBeVisible()
  await expect(success).not.toContainText(/dia|semana|mês|prazo|em breve/i)

  expect(engine.waitlistEmails()).toEqual(["consultor@escritorio.com.br"])
})

test("waitlist: falha de rede mostra erro tratado, não a tela quebrada", async ({ page }) => {
  await mockEngine(page, { failWaitlist: true })

  await page.goto("/")
  const emailInput = page.getByPlaceholder("seu@email.com")
  await emailInput.scrollIntoViewIfNeeded()
  await emailInput.fill("consultor@escritorio.com.br")
  await page.getByRole("button", { name: "Entrar na lista de espera" }).click()

  await expect(page.getByRole("alert").filter({ hasText: "falha simulada de rede" })).toBeVisible()
  // Formulário continua utilizável — nenhuma exceção não tratada travou a página.
  await expect(page.getByRole("button", { name: "Entrar na lista de espera" })).toBeEnabled()
})
