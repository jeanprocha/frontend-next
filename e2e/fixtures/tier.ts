// Porta de tier E2E (FE-4/PR 4f): src/lib/auth-client.tsx lê o cookie
// `e2e_tier` sob o bypass e injeta publicMetadata.tribia_plan — o mesmo
// caminho que o plan-provider já usa para o Clerk real. Chamar ANTES do
// primeiro page.goto: o cookie precisa existir quando o app monta.
import type { Page } from "@playwright/test"

export type E2ETier = "free" | "pro" | "premium"

export async function definirTierE2E(page: Page, tier: E2ETier): Promise<void> {
  await page.context().addCookies([
    { name: "e2e_tier", value: tier, domain: "localhost", path: "/" },
  ])
}
