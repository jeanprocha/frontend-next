// Carteira → workspace do cliente (FE-4/PR 4f): prova o fluxo central da
// fase — a identidade do cliente vive só na URL. Semeadura do contexto,
// persistência com company_id e ausência de vazamento entre clientes.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"
import { COMPANIES_FIXTURE, E2E_COMPANY_ID_A, E2E_COMPANY_ID_B } from "./fixtures/data"

test("carteira → workspace: semeia contexto, simula com company_id e não vaza entre clientes", async ({
  page,
}) => {
  const engine = await mockEngine(page, { companies: COMPANIES_FIXTURE })

  await page.goto("/clientes")
  await expect(page.getByText(COMPANIES_FIXTURE[0].name)).toBeVisible()
  await expect(page.getByText(COMPANIES_FIXTURE[1].name)).toBeVisible()

  // Abre o workspace do cliente A (primeiro card — ordem = COMPANIES_FIXTURE,
  // portfolio-page.tsx não reordena).
  await page.getByRole("button", { name: "Abrir cliente" }).nth(0).click()
  await expect(page).toHaveURL(new RegExp(`/clientes/${E2E_COMPANY_ID_A}$`))
  await expect(
    page.getByRole("heading", { name: "Simulador de Reforma Tributária" }),
  ).toBeVisible()

  // Semeadura: o contexto do cliente A pré-carrega o formulário (#context,
  // ver context-hub.tsx — aplicarContextoDoCliente).
  await expect(page.locator("#context")).toHaveValue(COMPANIES_FIXTURE[0].tax_context)

  // Simula — o companyId da URL viaja até o payload de persistência.
  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").fill("12000.00")
  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")

  // A lista "Simulações deste cliente" reflete o registro recém-persistido
  // (invalidação de queryKeys.simulationRecords.all após o persist).
  await expect(page.getByText("Simulações deste cliente")).toBeVisible()
  await expect(page.getByRole("button", { name: /Ano 2026/ })).toBeVisible()
  expect(engine.simulationRecordsCallCount()).toBe(1)

  // Troca de cliente: volta à carteira e abre o cliente B — nada do
  // contexto/resultado de A deve sobreviver (identidade só na URL).
  await page.goto("/clientes")
  await page.getByRole("button", { name: "Abrir cliente" }).nth(1).click()
  await expect(page).toHaveURL(new RegExp(`/clientes/${E2E_COMPANY_ID_B}$`))
  await expect(page.locator("#context")).toHaveValue(COMPANIES_FIXTURE[1].tax_context)
  // Resultado da simulação de A não vaza para o workspace de B.
  await expect(page.locator("#tribia-fvh-title")).toHaveCount(0)
})
