// Etapa M/PR 8 — "fix(ux): erros de persistência visíveis". Antes deste PR
// uma falha de rede no save inicial ou no recálculo pós-override morria em
// console.error/NO_OP: o veredito continuava na tela como se tudo tivesse
// sido persistido, sem nenhum sinal para quem está testando. Este spec prova
// as duas superfícies novas (banner + retry) com falha de rede simulada via
// mock, como pede o critério de pronto do PR.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"
import { RECALC_SIMULATION_FIXTURE, SIMULATION_FIXTURE } from "./fixtures/data"

async function fillMinimalSimulation(page: import("@playwright/test").Page) {
  await page.goto("/simulador")
  await expect(
    page.getByRole("heading", { name: "Simulador de Reforma Tributária" }),
  ).toBeVisible()

  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").fill("12000.00")

  await page
    .getByRole("button", { name: "Passo 2: adicionar a primeira despesa para análise de créditos com citação da lei" })
    .click()
  await page.getByLabel("Identificação da despesa").fill("Licença de software ERP")
  await page.getByLabel("Valor (BRL)").last().fill("3000.00")

  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")
}

test("falha ao salvar a simulação inicial mostra o banner e o retry recupera", async ({ page }) => {
  // 1ª chamada de POST /simulation-records (o auto-save "initial" logo após
  // simular) falha; a 2ª (disparada pelo clique em "Tentar novamente") sucede.
  const engine = await mockEngine(page, { failSimulationRecordCalls: [1] })

  await fillMinimalSimulation(page)

  const persistBanner = page.getByRole("alert").filter({ hasText: "Não foi possível salvar esta simulação." })
  await expect(persistBanner).toBeVisible()
  await expect(persistBanner).toContainText("falha simulada de rede (fixture E2E)")

  await persistBanner.getByRole("button", { name: "Tentar novamente" }).click()
  await expect(persistBanner).toBeHidden({ timeout: 5_000 })

  expect(engine.simulationRecordsCallCount()).toBe(2)
})

test("falha ao recalcular após override mostra o motivo na Mesa e o retry recupera", async ({ page }) => {
  // 2ª chamada de POST /simulations é o recálculo disparado pelo override —
  // falha; a 3ª (via "Tentar novamente" na Mesa) usa RECALC_SIMULATION_FIXTURE.
  const engine = await mockEngine(page, {
    simulationResponses: [SIMULATION_FIXTURE, RECALC_SIMULATION_FIXTURE],
    failSimulationCalls: [2],
  })

  await fillMinimalSimulation(page)
  expect(engine.simulationsCallCount()).toBe(1)

  await page.getByRole("button", { name: "MESA" }).click()
  await page.getByRole("button", { name: /Clique para substituir/ }).click()
  await page.getByRole("option", { name: "Não elegível a crédito" }).click()
  await page.getByRole("button", { name: "Aplicar" }).click()

  // Recálculo debounced dispara e falha — banner destrutivo com a mensagem
  // real (não o texto genérico de "ainda pendente") e CTA "Tentar novamente".
  const recalcBanner = page.getByRole("status").filter({ hasText: "Não foi possível recalcular" })
  await expect(recalcBanner).toBeVisible({ timeout: 5_000 })
  await expect(recalcBanner).toContainText("falha simulada de rede (fixture E2E)")

  await recalcBanner.getByRole("button", { name: "Tentar novamente" }).click()

  // Sucesso: o banner de pendência desaparece por completo (nem a variante
  // genérica nem a de erro continuam montadas).
  await expect(
    page.getByRole("status").filter({ hasText: "Classificações alteradas" }),
  ).toBeHidden({ timeout: 5_000 })

  expect(engine.simulationsCallCount()).toBe(3)
})
