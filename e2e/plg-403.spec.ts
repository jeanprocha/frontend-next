// Interceptor 403 PLG (FE-4/PR 4f): todo 403 com `code` no corpo, de
// qualquer endpoint, cai no PlgLimitDialogHost global (lib/http.ts →
// throwApiError → plgLimitListener) e abre o mesmo PlgUpgradeDialog
// (feature="generic") — não é um erro de formulário local.
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"

test("403 de quota/limite abre o diálogo de upgrade central com uso atual", async ({ page }) => {
  await mockEngine(page)

  // Sobrepõe o classify (1º passo do pipeline) com um 403 PLG — registrado
  // DEPOIS de mockEngine, então esta rota vence por LIFO no page.route.
  await page.route("http://127.0.0.1:8080/credit-classifications/batch", (route) =>
    route.fulfill({
      status: 403,
      body: JSON.stringify({
        error: "Limite diário de simulações atingido",
        code: "quota_exceeded",
        limit: 5,
        used: 5,
        plan: "free",
      }),
      headers: { "content-type": "application/json" },
    }),
  )

  await page.goto("/simulador")
  await page
    .getByRole("button", { name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita" })
    .click()
  await page.getByLabel("Identificação do serviço").fill("Consultoria tributária")
  await page.getByLabel("Valor (BRL)").fill("12000.00")
  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()

  await expect(
    page.getByRole("heading", { name: "TribIA Pro — mais profundidade para o seu fluxo" }),
  ).toBeVisible()
  await expect(page.getByText("Uso atual: 5 de 5 no plano free.")).toBeVisible()
})
