// Gating do tier Free (FE-4/PR 4f): quota visível na top bar, dossiê
// bloqueado com tease Pro e upsell de comparação A/B no histórico global —
// os três seguem a mesma fonte (plan-provider via publicMetadata.tribia_plan,
// portado pelo cookie e2e_tier em lib/auth-client.tsx).
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"
import { definirTierE2E } from "./fixtures/tier"
import { QUOTA_FREE_FIXTURE, RECORDS_LIST_FIXTURE } from "./fixtures/data"

test("tier free: PlgLimitMeter, dossiê bloqueado (tease) e upsell A/B no histórico", async ({ page }) => {
  await definirTierE2E(page, "free")
  await mockEngine(page, { quota: QUOTA_FREE_FIXTURE, records: RECORDS_LIST_FIXTURE })

  await page.goto("/simulador")
  await expect(page.getByText("Simulações hoje: 3/5")).toBeVisible()

  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").fill("12000.00")
  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")

  // Dossiê bloqueado no Free: CTA com cadeado abre o tease, nunca gera o dossiê.
  const dossierLocked = page.getByRole("button", { name: "Dossiê digital — disponível no plano Pro" })
  await expect(dossierLocked).toBeVisible()
  await dossierLocked.click()
  await expect(page.getByText("Modo apresentação — Pro")).toBeVisible()
  await expect(page.getByRole("link", { name: "Ver planos Pro" })).toBeVisible()
  await page.keyboard.press("Escape")

  // Upsell A/B no histórico global: os 2 registros do fixture + o que acabou
  // de ser persistido acima (sem company_id — simulador avulso). Seleciona 2.
  await page.goto("/simulacoes")
  const checkboxes = page.getByRole("checkbox", { name: /comparação A\/B \(disponível no plano Pro\)/ })
  await expect(checkboxes).toHaveCount(3)
  await checkboxes.nth(0).check()
  await checkboxes.nth(1).check()
  const conhecerNoPro = page.getByRole("button", { name: "Conhecer no Pro" })
  await expect(conhecerNoPro).toBeVisible()
  await conhecerNoPro.click()
  await expect(page.getByRole("heading", { name: "Comparar cenários (A/B)" })).toBeVisible()
})
