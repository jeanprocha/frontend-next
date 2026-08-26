import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { E2E_AUTH_BYPASS } from "@/lib/e2e-auth-bypass"

// Rotas que exigem autenticação — qualquer sub-rota de /dashboard
// (Dossiés públicos em /report/* permanecem acessíveis sem sessão; dados servidos via GET /public/simulation-records/{id} no engine.)
const isProtected = createRouteMatcher(["/dashboard(.*)"])

const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
})

// Sob o bypass E2E (FE-0), passthrough puro: a auth do Clerk nunca é
// invocada (nem checagem de sessão, nem chamada de rede) — 100% offline.
// A CRIAÇÃO do clerkMiddleware acima é inofensiva (não faz I/O nem lança);
// só a invocação por request faria. A flag é morta em `next build` — ver
// e2e-auth-bypass.ts.
const activeProxy = E2E_AUTH_BYPASS ? () => NextResponse.next() : clerkProxy

// Next.js 16+: `proxy.ts` — o bundler resolve `export const proxy` antes do `default`.
export const proxy = activeProxy
export default activeProxy

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
