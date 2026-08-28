// Dossiê público (FE-4/PR 4f): cobre o caso não coberto pelo smoke — acesso
// direto à URL /report/[id] (cold load, sem passar pelo formulário) e o
// caso de UUID inexistente. Same-origin: page.route intercepta
// /api/public/simulation-records/* antes do route handler do Next
// encaminhar ao engine (engine-mock.ts).
import { expect, test } from "@playwright/test"
import { RECORD_DETAIL_FIXTURE, RECORD_DETAIL_WITH_DIVERGENCE_FIXTURE } from "./fixtures/data"

const RECORD_ID = RECORD_DETAIL_FIXTURE.id
const DIVERGENT_RECORD_ID = RECORD_DETAIL_WITH_DIVERGENCE_FIXTURE.id
const UNKNOWN_ID = "99999999-9999-4999-8999-999999999999"

test("dossiê público: cold load direto na URL renderiza conteúdo real", async ({ page }) => {
  await page.route("**/api/public/simulation-records/*", (route) => {
    const id = route.request().url().split("/").pop()
    if (id === RECORD_ID) {
      return route.fulfill({
        status: 200,
        body: JSON.stringify(RECORD_DETAIL_FIXTURE),
        headers: { "content-type": "application/json" },
      })
    }
    return route.fulfill({
      status: 404,
      body: JSON.stringify({ error: "Simulação não encontrada" }),
      headers: { "content-type": "application/json" },
    })
  })

  await page.goto(`/report/${RECORD_ID}`)
  await expect(page.getByRole("button", { name: /Exportar para PDF/ })).toBeVisible()
  await expect(page.getByRole("heading", { name: /Mesa de operações/ })).toBeVisible()
})

// Etapa C/PR4, achado 9: consultant_override precisa sobreviver ao
// round-trip save→load no backend para aparecer aqui. Cold load — sem
// clique, sem hover, sem estado local — é a aproximação mais fiel de
// "reabrir o dossiê noutra máquina" que dá para testar sem banco real.
// A trilha é `hidden print:block` (mesmo idioma de CalculationTracePrint):
// não fica visível na tela, mas .toBeAttached() prova que está no DOM —
// é o que importa para o PDF, que é o window.print() desse mesmo DOM.
test("dossiê público: divergência IA × consultor persiste e aparece ao reabrir (cold load)", async ({ page }) => {
  await page.route("**/api/public/simulation-records/*", (route) => {
    const id = route.request().url().split("/").pop()
    if (id === DIVERGENT_RECORD_ID) {
      return route.fulfill({
        status: 200,
        body: JSON.stringify(RECORD_DETAIL_WITH_DIVERGENCE_FIXTURE),
        headers: { "content-type": "application/json" },
      })
    }
    return route.fulfill({
      status: 404,
      body: JSON.stringify({ error: "Simulação não encontrada" }),
      headers: { "content-type": "application/json" },
    })
  })

  await page.goto(`/report/${DIVERGENT_RECORD_ID}`)
  await expect(page.getByRole("heading", { name: /Mesa de operações/ })).toBeVisible()

  // `hidden print:block` é display:none na tela — fora da árvore de
  // acessibilidade (getByRole não encontraria nada), mas presente no DOM.
  // Locators de texto/CSS não filtram por visibilidade: é isso que prova
  // que o gêmeo de impressão está montado sem depender de hover/clique.
  await expect(page.locator("h3", { hasText: "Trilha de divergência — IA × consultor" })).toBeAttached()
  await expect(page.getByText("Sugerido pela IA:")).toBeAttached()
  await expect(page.getByText("Definido pelo consultor:")).toBeAttached()
  await expect(page.getByText(/Não há nexo documental/)).toBeAttached()
})

test("dossiê público: UUID inexistente mostra erro em vez de tela em branco", async ({ page }) => {
  await page.route("**/api/public/simulation-records/*", (route) =>
    route.fulfill({
      status: 404,
      body: JSON.stringify({ error: "Simulação não encontrada" }),
      headers: { "content-type": "application/json" },
    }),
  )

  await page.goto(`/report/${UNKNOWN_ID}`)
  // role="alert" também bate no #__next-route-announcer__ do Next (a11y interna),
  // por isso o locator precisa do texto para mirar só no <p> de erro do PublicReport.
  await expect(page.getByRole("alert").filter({ hasText: "Simulação não encontrada" })).toBeVisible()
})
