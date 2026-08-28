// Etapa N/PR 9 (fato 12) — fecha a promessa "Marca do escritório no dossiê"
// (Premium) da landing. Dois specs:
// 1) sem Premium, /configuracoes mostra a tela travada com explicação, não
//    um erro nem o formulário.
// 2) com Premium, salvar grava a marca e ela chega ao dossiê — verificado
//    inspecionando o corpo real do POST /simulation-records que dispara
//    automaticamente assim que a simulação termina (persist "initial"), não
//    só o clique em "Gerar Dossiê digital" (esse POST só existiria de novo
//    se o persist automático ainda não tivesse rodado — na prática nunca
//    acontece a tempo, é exatamente o bug que este PR corrigiu).
import { expect, test } from "@playwright/test"
import { mockEngine } from "./fixtures/engine-mock"
import { definirTierE2E } from "./fixtures/tier"
import type { SimulationRecordCreatePayload } from "@/types/api"

test("sem Premium, a tela vem travada com explicação e CTA — não um erro", async ({ page }) => {
  await definirTierE2E(page, "pro")
  await mockEngine(page)
  await page.goto("/configuracoes")

  await expect(page.getByText("Marca do escritório — Premium")).toBeVisible()
  await expect(page.getByLabel("Nome do escritório")).toHaveCount(0)

  await page.getByRole("button", { name: "Conhecer no Premium" }).click()
  await expect(page.getByRole("heading", { name: "Marca do escritório no dossiê" })).toBeVisible()
})

test("com Premium, salvar a marca faz o próximo dossiê sair com ela (POST /simulation-records real)", async ({
  page,
}) => {
  await definirTierE2E(page, "premium")
  await mockEngine(page)

  let capturedBody: SimulationRecordCreatePayload | null = null
  await page.route("http://127.0.0.1:8080/**", async (route) => {
    const req = route.request()
    if (new URL(req.url()).pathname === "/simulation-records" && req.method() === "POST") {
      capturedBody = req.postDataJSON() as SimulationRecordCreatePayload
    }
    await route.fallback()
  })

  await page.goto("/configuracoes")
  await page.getByLabel("Nome do escritório").fill("Escritório Exemplo")
  await page.getByLabel("URL do logotipo").fill("https://exemplo.com/logo.png")
  await page.getByRole("button", { name: "Salvar" }).click()
  await expect(page.getByText("Alterações salvas.")).toBeVisible()

  // Navegação client-side (clique no link, não page.goto): o bypass E2E
  // guarda a marca salva em memória de módulo — um reload completo
  // reiniciaria o "Clerk" fake e perderia o que acabou de ser salvo, do
  // mesmo jeito que um usuário real não perderia sessão ao navegar.
  await page.getByRole("link", { name: "Simulador" }).click()
  await expect(page.getByRole("heading", { name: "Simulador de Reforma Tributária" })).toBeVisible()

  await page.getByRole("button", { name: "Clínica de fisioterapia" }).click()
  await page.getByRole("button", { name: /Simular impacto tributário/ }).click()
  await expect(page.locator("#tribia-fvh-title")).toHaveText("Veredito Financeiro")

  await expect.poll(() => capturedBody?.classifications_snapshot?.report_brand).toEqual({
    logo_url: "https://exemplo.com/logo.png",
    org_name: "Escritório Exemplo",
  })
})
