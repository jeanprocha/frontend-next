// Etapa N/PR 4 — o botão "Carregar cenário" existe para provar que dá pra
// sair do zero a um veredito sem digitar nada. Este spec cobre exatamente
// isso; a distinção entre os três cenários produzirem vereditos DIFERENTES
// entre si foi verificada ao vivo contra o motor real (não dá pra provar
// isso com mockEngine, que devolve sempre o mesmo fixture de simulação
// independente do input) — ver narrativa do commit.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"

test("simulador vazio mostra o placeholder, sem contexto pré-preenchido", async ({ page }) => {
  await mockEngine(page)
  await page.goto("/simulador")

  await expect(page.getByRole("heading", { name: "Simulador de Reforma Tributária" })).toBeVisible()

  // Etapa N/PR 4 (fato 7): companyContext deixou de vir com um default
  // oculto ("Empresa SaaS B2B..."). O textarea some vazio; quem orienta é o
  // placeholder do campo.
  const contextField = page.getByLabel("Contexto da empresa")
  await expect(contextField).toHaveValue("")
  await expect(contextField).toHaveAttribute("placeholder", /empresa SaaS|regime regular/)

  await expect(page.getByText("Quer testar sem digitar nada?")).toBeVisible()
})

test("carregar um cenário de exemplo e simular sem digitar nada", async ({ page }) => {
  await mockEngine(page)
  await page.goto("/simulador")

  await expect(page.getByText("Quer testar sem digitar nada?")).toBeVisible()
  await page.getByRole("button", { name: "Clínica de fisioterapia" }).click()

  // O picker some assim que o formulário deixa de estar vazio (fato 7 —
  // carregar por cima de dados já digitados seria perda de trabalho silenciosa).
  await expect(page.getByText("Quer testar sem digitar nada?")).toHaveCount(0)

  // Regime, serviços e despesas do cenário vieram prontos (campos são inputs).
  await expect(page.locator('input[value="Sessões de fisioterapia"]')).toBeVisible()
  await expect(page.locator('input[value="Aluguel do consultório"]')).toBeVisible()

  // Nenhum campo foi digitado manualmente entre o goto() e este clique.
  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()

  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")
})
