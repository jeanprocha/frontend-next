import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Rotas que exigem autenticação — qualquer sub-rota de /dashboard
const isProtected = createRouteMatcher(["/dashboard(.*)"])

// Next.js 16+: `proxy.ts` — o bundler resolve `export const proxy` antes do `default`.
const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
})

export const proxy = clerkProxy
export default clerkProxy

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
