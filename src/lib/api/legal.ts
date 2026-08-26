import { API_BASE, authHeaders, throwApiError, tribiaPlanHeader } from "@/lib/http"
import type { LawArticleResponse, LawPdfAnchorResponse } from "@/types/api"

/** Texto integral do artigo (chunks agregados no backend). id = article_id da linha do chunk. */
export async function fetchLawArticle(chunkArticleId: string): Promise<LawArticleResponse> {
  const enc = encodeURIComponent(chunkArticleId)
  const res = await fetch(`${API_BASE}/law/articles/${enc}`)
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar artigo")
  }
  return res.json()
}

/** Ancoragem ao PDF oficial (LC68). Requer plano Pro/Premium e chunk com pdf_page na ingestão. */
export async function fetchLawPdfAnchor(
  chunkArticleId: string,
  token: string,
  userId: string,
  plan: string,
): Promise<LawPdfAnchorResponse> {
  const enc = encodeURIComponent(chunkArticleId)
  const res = await fetch(`${API_BASE}/law/articles/${enc}/pdf-anchor`, {
    headers: {
      ...authHeaders(token, userId),
      ...tribiaPlanHeader(plan),
    },
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar ancoragem PDF")
  }
  return res.json()
}
