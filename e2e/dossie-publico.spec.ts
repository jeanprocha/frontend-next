// Dossiê público (FE-4/PR 4f): cobre o caso não coberto pelo smoke — acesso
// direto à URL /report/[id] (cold load, sem passar pelo formulário) e o
// caso de UUID inexistente. Same-origin: page.route intercepta
// /api/public/simulation-records/* antes do route handler do Next
// encaminhar ao engine (engine-mock.ts).
import { expect, test } from "@playwright/test"
import { RECORD_DETAIL_FIXTURE } from "./fixtures/data"

const RECORD_ID = RECORD_DETAIL_FIXTURE.id
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

test("dossiê público: UUID inexistente mostra erro em vez de tela em branco", async ({ page }) => {
  await page.route("**/api/public/simulation-records/*", (route) =>
    route.fulfill({
      status: 404,
      body: JSON.stringify({ error: "Simulação não encontrada" }),
      headers: { "content-type": "application/json" },
    }),
  )

  await page.goto(`/report/${UNKNOWN_ID}`)
  await expect(page.getByRole("alert")).toBeVisible()
})
