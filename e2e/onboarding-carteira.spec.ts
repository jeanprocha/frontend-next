// Onboarding guiado (Etapa M/PR 4): prova que um usuário novo — carteira
// vazia, zero empresas cadastradas — chega ao primeiro dossiê só seguindo a
// UI (empty state "primeira simulação em 3 passos" → simulador → CSV de
// exemplo → veredito → dossiê), sem precisar cadastrar cliente antes.
import path from "path"
import { expect, test } from "@playwright/test"
import { E2E_RECORD_ID, mockEngine } from "./fixtures/engine-mock"

test("onboarding: carteira vazia → CSV de exemplo → veredito → dossiê", async ({ page }) => {
  await mockEngine(page) // companies omitido = [] — carteira vazia, como um usuário novo vê

  await page.goto("/clientes")

  // Empty state guiado — os 3 passos e os dois caminhos (simulador direto ou
  // cadastrar cliente primeiro) substituem o antigo "clique em Novo cliente"
  // sem alternativa para quem só quer testar.
  await expect(page.getByText("Nenhum cliente cadastrado ainda.")).toBeVisible()
  await expect(page.getByText("Baixe o CSV de exemplo")).toBeVisible()
  const csvLink = page.getByRole("link", { name: "despesas.csv" })
  await expect(csvLink).toHaveAttribute("href", "/despesas.csv")

  await page.getByRole("link", { name: "Ir para o simulador" }).click()
  await expect(
    page.getByRole("heading", { name: "Simulador de Reforma Tributária" }),
  ).toBeVisible()

  // CSV de exemplo (fixture com o mesmo formato do public/despesas.csv real).
  await page.getByRole("button", { name: "Upload de CSV" }).click()
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "fixtures", "despesas.csv"))
  await expect(page.getByLabel("Identificação da despesa")).toHaveValue("Hospedagem AWS")

  // Falta a receita — o CSV só traz despesas.
  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").first().fill("12000.00")

  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")

  // Dossiê: cold load em outra "aba" — prova de ponta a ponta sem depender
  // de estado local (mesmo padrão de smoke-dossie.spec.ts).
  await page.goto(`/report/${E2E_RECORD_ID}`)
  await expect(page.getByRole("heading", { name: /Fundamentação de créditos/ })).toBeVisible()
})
