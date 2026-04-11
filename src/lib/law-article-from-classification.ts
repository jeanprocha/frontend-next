import type { ClassificationItem, EvidenceArticle } from "@/types/api"

/** Primeiro `article_id` não vazio entre as evidências RAG (chunk ligável a GET /law/articles/{id}). */
export function resolveLawArticleChunkId(c: ClassificationItem): string | null {
  for (const e of c.evidence ?? []) {
    const id = typeof e.article_id === "string" ? e.article_id.trim() : ""
    if (id) return id
  }
  return null
}

/** Primeira evidência com `content` não vazio (snippets alinhados ao mesmo item). */
export function firstEvidenceWithContent(c: ClassificationItem): EvidenceArticle | null {
  for (const e of c.evidence ?? []) {
    const t = typeof e.content === "string" ? e.content.trim() : ""
    if (t) return e
  }
  return null
}

/** Primeiro trecho de evidência com texto (quando o id do chunk não veio na resposta). */
export function firstEvidenceExcerpt(c: ClassificationItem): string | null {
  const e = firstEvidenceWithContent(c)
  return e?.content?.trim() ? e.content.trim() : null
}
