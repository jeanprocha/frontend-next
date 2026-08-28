import type { MetadataRoute } from "next"
import { appUrl } from "@/lib/app-url"

/**
 * Etapa M/PR 5. Bloqueia crawler nas rotas protegidas por Clerk e no
 * dossiê público — este já é noindex por página (report/[id]/page.tsx),
 * mas reforçar aqui cobre bots que ignoram meta robots e só leem
 * robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  const base = appUrl()
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/clientes", "/simulador", "/simulacoes", "/report"],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
