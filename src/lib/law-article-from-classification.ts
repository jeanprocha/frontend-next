import type { ClassificationItem } from "@/types/api"

/** Primeiro `article_id` não vazio entre as evidências RAG (chunk ligável a GET /law/articles/{id}). */
export function resolveLawArticleChunkId(c: ClassificationItem): string | null {
  for (const e of c.evidence ?? []) {
    const id = typeof e.article_id === "string" ? e.article_id.trim() : ""
    if (id) return id
  }
  return null
}

/** Primeiro trecho de evidência com texto (quando o id do chunk não veio na resposta). */
export function firstEvidenceExcerpt(c: ClassificationItem): string | null {
  for (const e of c.evidence ?? []) {
    const t = typeof e.content === "string" ? e.content.trim() : ""
    if (t) return t
  }
  return null
}
