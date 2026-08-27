// W1/PR 8: GET /law/corpus foi ligado em useLawCorpus (LAW_CORPUS_API_ENABLED
// = true). Este spec prova que o badge/changelog do LegalVersionIndicator lê
// a resposta da API mockada — não a constante estática FISCAL_LAW_CHANGELOG
// (fallback só quando a API falha ou ainda não respondeu). LAW_CORPUS_FIXTURE
// usa version "9.9-e2e" e um changelog só seu, ambos ausentes do fallback.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"

test("badge de legislação lê o corpus da API, não a constante hardcoded", async ({ page }) => {
  await mockEngine(page)

  await page.goto("/simulador")

  // aria-label sobrepõe o texto visível — cobre desktop (span sm:inline) e
  // mobile (span sm:hidden, só "v9.9-e2e") com um único locator.
  const trigger = page.getByRole("button", { name: /Legislação LC 68\/2024 versão 9\.9-e2e/ })
  await expect(trigger).toBeVisible()

  await trigger.click()
  await expect(page.getByText("Corpus legal ativo via API (fixture E2E)")).toBeVisible()
})
