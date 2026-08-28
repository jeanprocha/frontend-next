// Etapa N/PR 1 — reabrir uma simulação pelo histórico global antes divergia
// do caminho do workspace em dois pontos: esquecia setCompanyRegime (o
// regime da sessão anterior ficava valendo) e não passava meta.recordId, o
// que fazia "Gerar Dossiê digital" criar um simulation-record duplicado em
// vez de reaproveitar o registro reaberto. hydrateSimulationFromRecord
// unificou os dois caminhos — este spec prova a integração ponta a ponta
// (clique real → fetch → hidratação → dossiê); a correção do regime em si
// (o ponto que o clique não consegue expor visualmente — reabrir cai direto
// na fase "results", sem o select de regime na tela) tem cobertura direta e
// exaustiva em hydrate-record.test.ts.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"
import { RECORD_DETAIL_FIXTURE, RECORDS_LIST_FIXTURE } from "./fixtures/data"

test("reabrir do histórico global carrega o registro certo e reaproveita ao gerar o dossiê", async ({ page }) => {
  const record = RECORDS_LIST_FIXTURE[0]
  const detail = {
    ...RECORD_DETAIL_FIXTURE,
    id: record.id,
    company_id: record.company_id,
    company_context: record.company_context ?? "",
    company_regime: "diferenciado_60",
  }

  const engine = await mockEngine(page, {
    records: RECORDS_LIST_FIXTURE,
    recordDetails: { [record.id]: detail },
  })

  await page.goto("/simulacoes")
  await page.getByRole("button", { name: /consultoria tributária/i }).click()
  await expect(page).toHaveURL(/\/simulador$/)

  // Prova que o registro CERTO foi carregado (não um genérico/anterior): o
  // carimbo de sessão ecoa o company_context do detalhe buscado por id.
  await expect(
    page.getByRole("region", { name: "Identificação da sessão de simulação" }),
  ).toContainText("consultoria tributária")

  const dossierButton = page.getByRole("button", { name: "Gerar dossiê digital e abrir em nova aba" })
  await expect(dossierButton).toBeEnabled()

  // Fecha a nova aba assim que abrir — não interessa o conteúdo dela aqui
  // (não herda o mock desta página), só que nenhum POST novo foi disparado
  // na página original: meta.recordId já veio da hidratação (fato 2).
  page.once("popup", (popup) => void popup.close())
  await dossierButton.click()
  await page.waitForTimeout(500)

  expect(engine.simulationRecordsCallCount()).toBe(0)
})
