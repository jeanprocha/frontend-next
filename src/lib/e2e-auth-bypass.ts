/**
 * Bypass de autenticação SÓ para o Playwright offline (FE-0).
 *
 * Fail-safe estrutural, não disciplina de configuração: `next build` compila
 * SEMPRE com NODE_ENV=production, e NODE_ENV/NEXT_PUBLIC_* são inlined no
 * bundle no momento do build — esta constante é literalmente `false` (dead
 * code eliminado) em QUALQUER artefato de produção, independentemente das
 * variáveis definidas no ambiente de deploy.
 */
export const E2E_AUTH_BYPASS =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === "1"

export const E2E_FAKE_USER_ID = "user_e2e_smoke"
