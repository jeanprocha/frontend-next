// Etapa N/PR 7 (fato 9) — antes, dois caminhos disparavam simulação
// (clique em "Simular impacto tributário" e o atalho Ctrl/Cmd+Enter) e os
// dois faziam `if (validServices.length === 0) return`: um no-op completo,
// sem nenhuma pista de por que nada aconteceu. Este spec prova que os dois
// agora mostram mensagem — e que valor não-numérico é recusado antes de
// virar NaN e seguir para o motor Go.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"

test("atalho Ctrl+Enter com formulário vazio mostra mensagem em vez de nada acontecer", async ({ page }) => {
  await mockEngine(page)
  await page.goto("/simulador")
  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()

  // Linha de serviço existe mas está vazia — nem descrição nem valor preenchidos.
  await page.keyboard.press("Control+Enter")

  await expect(page.getByText("Adicione ao menos um serviço com valor para simular.")).toBeVisible()
  // Continua na fase de entrada — nenhuma simulação foi disparada.
  await expect(page.getByRole("heading", { name: "Simulador de Reforma Tributária" })).toBeVisible()
})

test("valor 'abc' num serviço é recusado com mensagem e realce na linha (clique)", async ({ page }) => {
  await mockEngine(page)
  await page.goto("/simulador")
  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").fill("abc")

  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()

  const message = page.getByText(
    'Revise o valor ou a alíquota de "Consultoria tributária" — use apenas números (ex.: 1200,00).',
  )
  await expect(message).toBeVisible()
  await expect(page.getByLabel("Valor (BRL)")).toHaveAttribute("aria-invalid", "true")

  // Corrigir o valor limpa a mensagem sozinho (setServices limpa o erro) e permite simular.
  await page.getByLabel("Valor (BRL)").fill("12000.00")
  await expect(message).toHaveCount(0)
  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")
})

test("ano fora da faixa 2026–2033 é corrigido ao sair do campo, não rejeitado", async ({ page }) => {
  await mockEngine(page)
  await page.goto("/simulador")
  const yearInput = page.locator("#year")

  await yearInput.fill("1999")
  await yearInput.blur()
  await expect(yearInput).toHaveValue("2026")

  await yearInput.fill("2099")
  await yearInput.blur()
  await expect(yearInput).toHaveValue("2033")

  await yearInput.fill("2029")
  await yearInput.blur()
  await expect(yearInput).toHaveValue("2029")
})
