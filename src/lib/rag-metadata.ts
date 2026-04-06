import type { AiMetadata, ClassificationItem } from "@/types/api"

/**
 * Rótulo legível a partir de article_id de chunk (ex.: lc68_0052_art_52_p2 → Art. 52 · LC 68/2024).
 */
export function formatArticleLabel(articleId: string): string {
  const id = articleId.trim()
  if (!id) return ""
  const m = id.match(/_art_(\d+)/i)
  if (m) {
    return `Art. ${m[1]} · LC 68/2024`
  }
  if (id.length > 42) {
    return `${id.slice(0, 20)}…`
  }
  return id
}

/**
 * Agrega similaridade RAG sobre classificações de serviços e despesas.
 *
 * Regra: para cada linha com evidências, usa o máximo de similarity entre trechos;
 * o score global é a média desses máximos (0–1). Não é probabilidade de acerto do LLM,
 * apenas relevância da recuperação vetorial.
 *
 * Retorna null se não houver nenhuma evidência (evita percentagem fictícia).
 */
export function aggregateRagMetadata(
  serviceResults: ClassificationItem[],
  expenseResults: ClassificationItem[],
): AiMetadata | null {
  const rows = [...serviceResults, ...expenseResults].filter(
    (r) => !r.error && r.evidence && r.evidence.length > 0,
  )
  if (rows.length === 0) return null

  const perItemMax: number[] = []
  const sourceIds = new Set<string>()

  for (const r of rows) {
    let maxSim = 0
    for (const ev of r.evidence) {
      const s = Number(ev.similarity)
      if (Number.isFinite(s)) {
        maxSim = Math.max(maxSim, Math.min(1, Math.max(0, s)))
      }
      const aid = ev.article_id?.trim()
      if (aid) sourceIds.add(aid)
    }
    if (maxSim > 0) perItemMax.push(maxSim)
  }

  if (perItemMax.length === 0) return null

  const confidence_score =
    perItemMax.reduce((a, b) => a + b, 0) / perItemMax.length

  const sources_analyzed = [...sourceIds]
    .map(formatArticleLabel)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))

  // Dedupe rótulos idênticos (vários chunks do mesmo artigo)
  const uniqueLabels = [...new Set(sources_analyzed)]

  return {
    confidence_score: Math.min(1, Math.max(0, confidence_score)),
    sources_analyzed: uniqueLabels,
  }
}
