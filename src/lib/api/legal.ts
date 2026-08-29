import { API_BASE, authHeaders, throwApiError, tribiaFetch, tribiaPlanHeader } from "@/lib/http"
import type { LawArticleResponse, LawPdfAnchorResponse } from "@/types/api"
import type { FiscalChangelogEntry } from "@/lib/fiscal-law-changelog"

export interface LawCorpusDocument {
  id: string
  label: string
  /** Versão do motor/ingestão que produziu este documento (ex.: "2.1"). */
  version: string
  /** ISO — data-base do corpus ingerido. */
  published_at: string
  source_url: string
  /** Liga aos IDs de chunk do RAG (ex.: "lc68_"). */
  chunk_prefix?: string
}

export interface LawCorpusResponse {
  documents: LawCorpusDocument[]
  current_document_id: string
  changelog: FiscalChangelogEntry[]
}

/**
 * Espelho proposto de `GET /law/corpus` (W1 — a rota ainda não existe no
 * backend Go; ver features/legal-corpus/use-law-corpus.ts, que mantém isto
 * desligado via `LAW_CORPUS_API_ENABLED = false` até o W1 entregar).
 */
export async function fetchLawCorpus(): Promise<LawCorpusResponse> {
  const res = await tribiaFetch(`${API_BASE}/law/corpus`)
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar corpus legal")
  }
  return res.json()
}

/** Texto integral do artigo (chunks agregados no backend). id = article_id da linha do chunk. */
export async function fetchLawArticle(chunkArticleId: string): Promise<LawArticleResponse> {
  const enc = encodeURIComponent(chunkArticleId)
  const res = await tribiaFetch(`${API_BASE}/law/articles/${enc}`)
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar artigo")
  }
  return res.json()
}

/** Ancoragem ao PDF oficial do corpus legal. Requer plano Pro/Premium e chunk com pdf_page na ingestão. */
export async function fetchLawPdfAnchor(
  chunkArticleId: string,
  token: string,
  userId: string,
  plan: string,
): Promise<LawPdfAnchorResponse> {
  const enc = encodeURIComponent(chunkArticleId)
  const res = await tribiaFetch(`${API_BASE}/law/articles/${enc}/pdf-anchor`, {
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

/**
 * Ancoragem ao PDF oficial sem sessão — o dossiê público (`/report/[id]`) é
 * lido por quem não tem conta, e a rota autenticada respondia 401 justamente
 * a esse leitor. Mesma resolução do lado do servidor; o gate Pro continua
 * valendo dentro da ferramenta (ver backend: publicLawPdfAnchorHandler).
 */
export async function fetchPublicLawPdfAnchor(
  chunkArticleId: string,
): Promise<LawPdfAnchorResponse> {
  const enc = encodeURIComponent(chunkArticleId)
  const res = await tribiaFetch(`${API_BASE}/public/law-articles/${enc}/pdf-anchor`)
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar ancoragem PDF")
  }
  return res.json()
}
