/**
 * Origem pública deste app — fonte única para metadataBase (layout.tsx),
 * sitemap.ts e robots.ts (Etapa M/PR 5). Sem NEXT_PUBLIC_APP_URL definida
 * (dev local, ou deploy onde a var ainda não foi configurada), cai no
 * localhost — nunca inventa um domínio de produção.
 */
export function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return (raw || "http://localhost:3000").replace(/\/+$/, "")
}
