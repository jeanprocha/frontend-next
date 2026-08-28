// Etapa N/PR 10 — fecha a etapa. O roteiro exato da demonstração numa única
// sessão contínua: cenário de exemplo → simular → veredito → override na
// Mesa → recalcular → dossiê → voltar ao histórico → reabrir a MESMA
// simulação → gerar o dossiê de novo. É o teste que os fatos 1-3 do
// diagnóstico da Etapa N (regime perdido, registro duplicado, selo errado)
// teriam pego, e o que impede que voltem — history-reopen.spec.ts já cobre
// cada fato isoladamente a partir de um registro pré-semeado; este spec
// prova que a cadeia inteira funciona junta, numa sessão que se autogera do
// zero (nada pré-semeado em `records`).
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"
import { E2E_RECORD_ID, RECALC_SIMULATION_FIXTURE, RECORD_DETAIL_FIXTURE, SIMULATION_FIXTURE } from "./fixtures/data"

test("roteiro de demonstração: cenário → simular → override → recalcular → dossiê → reabrir → dossiê de novo sem duplicar", async ({
  page,
}) => {
  const CONTEXTO_CENARIO =
    "Clínica de fisioterapia, regime de profissional liberal, presta atendimento e reabilitação física a pacientes particulares e convênios."

  // "O que o backend guardaria" para o registro que esta sessão vai criar —
  // mockEngine não ecoa o corpo do POST na resposta do detalhe, então o
  // fixture representa isso explicitamente (mesmo padrão de history-reopen.spec.ts).
  const detail = {
    ...RECORD_DETAIL_FIXTURE,
    id: E2E_RECORD_ID,
    company_context: CONTEXTO_CENARIO,
    company_regime: "prof_liberal",
  }

  const engine = await mockEngine(page, {
    simulationResponses: [SIMULATION_FIXTURE, RECALC_SIMULATION_FIXTURE],
    recordDetails: { [E2E_RECORD_ID]: detail },
  })

  // 1. Do zero ao formulário pronto, sem digitar nada (Etapa N/PR 4).
  await page.goto("/simulador")
  await expect(page.getByRole("heading", { name: "Simulador de Reforma Tributária" })).toBeVisible()
  await page.getByRole("button", { name: "Clínica de fisioterapia" }).click()

  // 2. Simular — veredito real, não presumido.
  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")
  await expect(page.getByText(SIMULATION_FIXTURE.strategy_insight!)).toBeVisible()

  // Fato 3 (Etapa N) — simulação recém-rodada NÃO é "do histórico".
  await expect(page.getByText("Simulação do histórico")).toHaveCount(0)
  expect(engine.simulationRecordsCallCount()).toBe(1)

  // 3. Override do consultor na Mesa → recálculo debounced (mesmo fluxo de
  // override-recalc.spec.ts) — a demo real inclui essa correção manual.
  await page.getByRole("button", { name: "MESA" }).click()
  await page.getByRole("button", { name: /Clique para substituir/ }).first().click()
  await page.getByRole("option", { name: "Não elegível a crédito" }).click()
  await page.getByRole("button", { name: "Aplicar" }).click()

  await expect(page.getByRole("status").filter({ hasText: "Classificações alteradas" })).toBeVisible()
  await expect(page.getByRole("status").filter({ hasText: "Classificações alteradas" })).toBeHidden({
    timeout: 5_000,
  })

  await page.getByRole("button", { name: "VEREDITO" }).click()
  await expect(page.getByText(RECALC_SIMULATION_FIXTURE.strategy_insight!)).toBeVisible()
  expect(engine.simulationsCallCount()).toBe(2)
  expect(engine.simulationRecordsCallCount()).toBe(2)

  // 4. Gerar o dossiê pela primeira vez — reaproveita o registro do
  // auto-persist/recálculo, não cria um terceiro.
  const dossierButton = page.getByRole("button", { name: "Gerar dossiê digital e abrir em nova aba" })
  await expect(dossierButton).toBeEnabled()
  page.once("popup", (popup) => void popup.close())
  await dossierButton.click()
  await page.waitForTimeout(500)
  expect(engine.simulationRecordsCallCount()).toBe(2)

  // 5. Voltar ao histórico e reabrir a MESMA simulação.
  await page.getByRole("link", { name: "Voltar ao histórico" }).click()
  await expect(page).toHaveURL(/\/simulacoes$/)

  // O mock sintetiza uma linha de listagem por POST /simulation-records (2
  // nesta sessão: initial + recálculo) — ambas com o mesmo id (mockEngine
  // sempre devolve SAVE_RECORD_FIXTURE), então levam ao mesmo detalhe.
  await page
    .getByRole("button", { name: new RegExp(CONTEXTO_CENARIO.slice(0, 30)) })
    .first()
    .click()
  await expect(page).toHaveURL(/\/simulador$/)

  // Prova que é o registro certo (não um genérico) e que fato 3 funciona nos
  // dois sentidos: reabrir do histórico é exatamente quando o selo DEVE aparecer.
  await expect(
    page.getByRole("region", { name: "Identificação da sessão de simulação" }),
  ).toContainText("Clínica de fisioterapia")
  await expect(page.getByText("Simulação do histórico")).toBeVisible()

  // 6. Fato 2 (Etapa N) — gerar o dossiê de novo a partir do registro
  // reaberto NÃO cria um registro novo.
  const dossierButtonReaberto = page.getByRole("button", { name: "Gerar dossiê digital e abrir em nova aba" })
  await expect(dossierButtonReaberto).toBeEnabled()
  page.once("popup", (popup) => void popup.close())
  await dossierButtonReaberto.click()
  await page.waitForTimeout(500)
  expect(engine.simulationRecordsCallCount()).toBe(2)
})
