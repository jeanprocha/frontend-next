import { defineConfig } from "@playwright/test"

const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    locale: "pt-BR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    // `next dev` (não build+start): o bypass é morto por construção em
    // `next build` (NODE_ENV=production) — ver src/lib/e2e-auth-bypass.ts.
    // O CI valida o build de produção num step próprio (sem o bypass).
    command: `npm run dev -- -p ${PORT}`,
    // Probe em /dashboard, não na raiz: `/` é a landing (Server Component
    // com <Show>/<SignInButton> do Clerk lado servidor) — fora do seam
    // client-side da FE-0, ela sempre 500 sob o bypass (limitação conhecida,
    // ver docs/arquitetura-frontend.md). /dashboard é a rota real do smoke.
    url: `${BASE_URL}/dashboard`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_E2E_AUTH_BYPASS: "1",
      // Desbloqueia o CTA "Gerar Dossiê digital" (fallback de tribia-plan-provider.tsx).
      NEXT_PUBLIC_TRIBIA_PLG_TIER: "pro",
      // Nada escuta aqui — page.route intercepta antes de qualquer requisição
      // de rede real chegar a este host.
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:8080",
      // Sem NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY de propósito: se o bypass
      // regredir, o smoke falha alto (ClerkProvider sem chave), não mascara.
    },
  },
})
