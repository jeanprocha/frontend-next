// E2E do importer CSV (FE-3, PR 3c): prova que o upload agora é um rascunho
// no formulário — classifica com contexto real + client_id, persiste e
// aparece no histórico — em vez do antigo fork classify-only (upload-zone.tsx
// dissolvido), que nunca chamava POST /simulations nem /simulation-records.
import path from "path"
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"

test("demo: upload de CSV preenche o formulário e simula (persiste)", async ({ page }) => {
  const engine = await mockEngine(page)

  await page.goto("/dashboard")
  await expect(
    page.getByRole("heading", { name: "Simulador de Reforma Tributária" }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Upload de CSV" }).click()
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "fixtures", "despesas.csv"))

  // O upload aplica o rascunho e a aba volta sozinha para "Simulação Manual".
  await expect(page.getByText(/despesa importada/)).toBeVisible()
  await expect(page.getByLabel("Identificação da despesa")).toHaveValue("Hospedagem AWS")
  await expect(page.getByLabel("Valor (BRL)")).toHaveValue("500.00")

  // Falta a receita — mesmo passo do smoke principal.
  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").first().fill("12000.00")

  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()

  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")

  // Diferença central da FE-3: o caminho CSV agora persiste, como o form.
  expect(engine.simulationRecordsCallCount()).toBe(1)
})
