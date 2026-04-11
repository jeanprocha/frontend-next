import type { AiMetadata, AiMetadataBreakdown, ClassificationItem, LawChunkMetadata } from "@/types/api"

/**
 * Citação determinística a partir dos metadados do chunk (alinhada ao servidor Go).
 */
export function formatLegalCitationFromMetadata(meta: LawChunkMetadata | undefined): string {
  if (!meta) return ""
  const span = meta.span_note?.trim()
  const al = (meta.article_label || meta.article_id || "").trim()
  if (!al) return ""
  if (span) return `${al} (${span})`
  const parts: string[] = [al]
  if (meta.paragraph?.trim()) parts.push(meta.paragraph.trim())
  if (meta.inciso?.trim()) parts.push(`inciso ${meta.inciso.trim()}`)
  if (meta.alinea?.trim()) parts.push(`alínea ${meta.alinea.trim()})`)
  return parts.join(", ")
}

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

const W_RAG = 0.45
const W_LLM = 0.35
const W_COV = 0.2

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function computeBreakdown(rows: ClassificationItem[]): AiMetadataBreakdown | null {
  const ok = rows.filter((r) => !r.error?.trim())
  if (ok.length === 0) return null

  let llmSum = 0
  let withEvidence = 0
  const ragMaxima: number[] = []

  for (const r of ok) {
    const conf = Number(r.confidence)
    llmSum += Number.isFinite(conf) ? clamp01(conf) : 0

    const ev = r.evidence
    if (ev && ev.length > 0) {
      withEvidence++
      let maxSim = 0
      for (const e of ev) {
        const s = Number(e.similarity)
        if (Number.isFinite(s)) {
          maxSim = Math.max(maxSim, clamp01(s))
        }
      }
      if (maxSim > 0) ragMaxima.push(maxSim)
    }
  }

  const classified_count = ok.length
  const llm_confidence_mean = classified_count > 0 ? llmSum / classified_count : 0
  const evidence_coverage = classified_count > 0 ? withEvidence / classified_count : 0
  const rag_similarity_mean =
    ragMaxima.length > 0 ? ragMaxima.reduce((a, b) => a + b, 0) / ragMaxima.length : 0

  return {
    rag_similarity_mean,
    llm_confidence_mean,
    evidence_coverage,
    classified_count,
    with_evidence_count: withEvidence,
  }
}

/**
 * Agrega RAG + classificação sobre serviços e despesas.
 *
 * O `confidence_score` combina: similaridade RAG média (linhas com evidência), confiança média do LLM
 * e cobertura de evidências — ver `breakdown`. Não é parecer jurídico nem probabilidade de acerto.
 */
export function aggregateRagMetadata(
  serviceResults: ClassificationItem[],
  expenseResults: ClassificationItem[],
): AiMetadata | null {
  const rows = [...serviceResults, ...expenseResults]
  const breakdown = computeBreakdown(rows)
  if (!breakdown) return null

  const combined = clamp01(
    W_RAG * breakdown.rag_similarity_mean +
      W_LLM * breakdown.llm_confidence_mean +
      W_COV * breakdown.evidence_coverage,
  )

  const sourceLabels = new Set<string>()
  for (const r of rows) {
    if (r.error?.trim()) continue
    for (const ev of r.evidence ?? []) {
      const cite = formatLegalCitationFromMetadata(ev.metadata)
      if (cite) {
        sourceLabels.add(cite)
        continue
      }
      const aid = ev.article_id?.trim()
      if (aid) sourceLabels.add(formatArticleLabel(aid))
    }
  }

  const sources_analyzed = [...sourceLabels].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"))

  return {
    confidence_score: combined,
    sources_analyzed,
    breakdown,
  }
}

/** Texto curto para tooltip ou rodapé (parâmetros da fórmula). */
export function ragScoreFormulaSummary(): string {
  return `${Math.round(W_RAG * 100)}% similaridade RAG média + ${Math.round(W_LLM * 100)}% confiança média do classificador + ${Math.round(W_COV * 100)}% cobertura de linhas com evidência na LC 68/2024.`
}
