// Etapa N/PR 8 (fato 10) — a API já mandava `company_id` em cada registro do
// histórico, mas a linha ignorava: mostrava só o `company_context` livre,
// igual pra registro vinculado a cliente ou não. Este spec prova os dois
// lados do critério de pronto — com cliente resolvido mostra o nome, sem
// cliente (registro legado) continua legível pelo contexto — e que a linha
// abre normalmente pelo clique nos dois casos.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"
import { COMPANIES_FIXTURE, RECORD_DETAIL_FIXTURE, RECORDS_LIST_FIXTURE } from "./fixtures/data"

test("registro vinculado a cliente mostra o nome do cliente; registro legado continua pelo contexto", async ({
  page,
}) => {
  const comCliente = RECORDS_LIST_FIXTURE[0] // company_id: E2E_COMPANY_ID_A
  const legado = RECORDS_LIST_FIXTURE[1] // company_id: null

  await mockEngine(page, {
    companies: COMPANIES_FIXTURE,
    records: RECORDS_LIST_FIXTURE,
    recordDetails: {
      [comCliente.id]: {
        ...RECORD_DETAIL_FIXTURE,
        id: comCliente.id,
        company_id: comCliente.company_id,
        company_context: comCliente.company_context ?? "",
      },
      [legado.id]: {
        ...RECORD_DETAIL_FIXTURE,
        id: legado.id,
        company_id: legado.company_id,
        company_context: legado.company_context ?? "",
      },
    },
  })

  await page.goto("/simulacoes")

  // Registro com cliente: nome "Consultoria Alfa Ltda" (COMPANIES_FIXTURE[0])
  // aparece como título da linha — não mais só o contexto livre.
  const linhaComCliente = page.getByRole("button", { name: /Consultoria Alfa Ltda/ })
  await expect(linhaComCliente).toBeVisible()
  await expect(linhaComCliente).toContainText("Ano 2026")

  // Registro legado (sem company_id): sem nome de cliente pra mostrar,
  // continua legível pelo contexto livre — comportamento inalterado.
  await expect(
    page.getByRole("button", { name: /Empresa legada sem cliente vinculado/ }),
  ).toBeVisible()

  // A linha abre normalmente pelo clique nos dois casos.
  await linhaComCliente.click()
  await expect(page).toHaveURL(/\/simulador$/)
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")

  await page.goto("/simulacoes")
  await page.getByRole("button", { name: /Empresa legada sem cliente vinculado/ }).click()
  await expect(page).toHaveURL(/\/simulador$/)
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")
})
