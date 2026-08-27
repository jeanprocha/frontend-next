// Smoke que protege a demo (FE-0): formulário → classificação IA → veredito
// → dossiê público. Offline total — mockEngine intercepta toda chamada ao
// motor Go; o bypass de auth (NEXT_PUBLIC_E2E_AUTH_BYPASS, injetado pelo
// webServer do playwright.config.ts) libera /simulador sem sessão Clerk.
import { expect, test } from "@playwright/test"
import { E2E_RECORD_ID, mockEngine } from "./fixtures/engine-mock"

test("demo: formulário → classificação IA → veredito → dossiê", async ({ page }) => {
  await mockEngine(page)

  await page.goto("/simulador")
  await expect(
    page.getByRole("heading", { name: "Simulador de Reforma Tributária" }),
  ).toBeVisible()

  // Passo 1 — receita. O aria-label sobrepõe o texto visível "Adicionar receita".
  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").fill("12000.00")
  // "Alíq. ISS" já vem preenchida com 0.05 — não precisa tocar.

  // Passo 2 — despesa. Agora existem 2 campos "Valor (BRL)" na tela.
  await page.getByRole("button", { name: /Passo 2 do pipeline/ }).click()
  await page.getByLabel("Identificação da despesa").fill("Licença de software ERP")
  await page.getByLabel("Valor (BRL)").last().fill("3000.00")

  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()

  // Resultado.
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")

  // CTA visível e habilitado prova: tier pro (env, desbloqueia o dossiê) +
  // resultado pronto (disabled só é true durante `loading`). O aria-label
  // sobrepõe o texto visível.
  await expect(
    page.getByRole("button", { name: "Gerar dossié digital e abrir em nova aba" }),
  ).toBeEnabled()

  // Dossiê: navega direto em vez de clicar — o CTA abre `window.open` numa
  // nova aba que não herda os page.route desta página, e o registro já foi
  // persistido em segundo plano (POST /simulation-records mockado sempre
  // devolve E2E_RECORD_ID) assim que a simulação terminou.
  await page.goto(`/report/${E2E_RECORD_ID}`)
  await expect(page.getByRole("button", { name: /Exportar para PDF/ })).toBeVisible()
  await expect(page.getByRole("heading", { name: /Mesa de operações/ })).toBeVisible()
})
