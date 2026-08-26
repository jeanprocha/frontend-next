// Fluxo mais arriscado do refactor da FE-1 (ainda sem cobertura antes deste
// spec): override do consultor → debounce 800ms → recálculo (POST /simulations
// simulate-only, sem reclassificar) → novo save. Nasce ANTES da extração da
// máquina de estados (docs/arquitetura-frontend.md §12, FE-1) para validar o
// comportamento atual e proteger a extração inteira — mesma filosofia da FE-0.
//
// Não assertar invalidação de cache: este spec deve sobreviver à unificação
// do passo de persistência feita no PR-D.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"
import { RECALC_SIMULATION_FIXTURE, SIMULATION_FIXTURE } from "./fixtures/data"

test("demo: override do consultor dispara recálculo debounced", async ({ page }) => {
  const engine = await mockEngine(page, {
    simulationResponses: [SIMULATION_FIXTURE, RECALC_SIMULATION_FIXTURE],
  })

  await page.goto("/dashboard")
  await expect(
    page.getByRole("heading", { name: "Simulador de Reforma Tributária" }),
  ).toBeVisible()

  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").fill("12000.00")

  await page.getByRole("button", { name: /Passo 2 do pipeline/ }).click()
  await page.getByLabel("Identificação da despesa").fill("Licença de software ERP")
  await page.getByLabel("Valor (BRL)").last().fill("3000.00")

  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")
  await expect(page.getByText(SIMULATION_FIXTURE.strategy_insight!)).toBeVisible()

  expect(engine.simulationsCallCount()).toBe(1)
  expect(engine.simulationRecordsCallCount()).toBe(1)

  // A tabela de despesas vive na aba "MESA" (AuditConfidenceTabs) — não é a
  // aba ativa por padrão (a jornada abre em "VEREDITO").
  await page.getByRole("button", { name: "MESA" }).click()

  // Abre o seletor de classificação da única despesa (Mesa de operações) e
  // aplica um override diferente da sugestão da IA (Elegível · Padrão).
  await page.getByRole("button", { name: /Clique para substituir/ }).click()
  await page.getByRole("option", { name: "Não elegível a crédito" }).click()
  await page.getByRole("button", { name: "Aplicar" }).click()

  // Indicador de pendência: os números ainda refletem a simulação anterior.
  await expect(
    page.getByRole("status").filter({ hasText: "Classificações alteradas" }),
  ).toBeVisible()

  // Segundo toggle, rápido (<800ms) — precisa ser uma opção REALMENTE
  // diferente da anterior: reselecionar a mesma opção já efetiva é um no-op
  // que só fecha o popover (expense-semantic-audit-table.tsx:handleSelect),
  // sem reagendar o debounce. Testa que o debounce cancela e reagenda em vez
  // de acumular (um único POST /simulations adicional, não dois).
  // Depois do 1º override, o trigger já é "curado" — aria-label muda de
  // "Clique para substituir" para "Clique para alterar".
  await page.getByRole("button", { name: /Clique para alterar/ }).click()
  await page.getByRole("option", { name: "Elegível · Diferenciado 60%" }).click()
  await page.getByRole("button", { name: "Aplicar" }).click()

  // O banner de pendência desaparece quando o recálculo termina
  // (markSimulationSynced) — sinal estrutural robusto de que o ciclo fechou.
  await expect(
    page.getByRole("status").filter({ hasText: "Classificações alteradas" }),
  ).toBeHidden({ timeout: 5_000 })

  // AuditConfidenceTabs troca o conteúdo visível (não é âncora de scroll) —
  // volta à aba "VEREDITO" para ver o parecer executivo atualizado.
  await page.getByRole("button", { name: "VEREDITO" }).click()

  // O veredito reflete a fixture de recálculo (ancorado pelo texto do
  // strategy_insight — mais robusto que casar formatação monetária).
  await expect(page.getByText(RECALC_SIMULATION_FIXTURE.strategy_insight!)).toBeVisible()

  // Exatamente um POST /simulations adicional apesar dos dois toggles em
  // sequência rápida — o debounce de 800ms cancela e reagenda, não acumula.
  expect(engine.simulationsCallCount()).toBe(2)
  // Um novo POST /simulation-records após o recálculo bem-sucedido.
  expect(engine.simulationRecordsCallCount()).toBe(2)
})
