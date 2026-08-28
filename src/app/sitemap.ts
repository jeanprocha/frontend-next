import type { MetadataRoute } from "next"
import { appUrl } from "@/lib/app-url"

/**
 * Só rotas públicas e indexáveis (Etapa M/PR 5). De propósito FORA:
 * /clientes, /simulador, /simulacoes (protegidas por Clerk — sem valor
 * para um crawler anônimo) e /report/[id] (dossiês são segredo-por-UUID,
 * já `robots: {index:false}` na própria rota — um sitemap listando-os
 * derrotaria o modelo de privacidade).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl()
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
  ]
}
