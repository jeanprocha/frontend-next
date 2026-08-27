import {
  isTenuousRagNexus,
  maxEvidenceSimilarity,
} from "@/lib/confidence-tiers"
import type { ClassificationItem } from "@/types/api"

/** Despesas do formulário com classificação sem erro e pelo menos uma evidência RAG. */
export function computeExpenseEvidenceCoverage(
  expenses: { id: string }[],
  classifications: ClassificationItem[],
): { withEvidence: number; total: number } {
  let withEvidence = 0
  const total = expenses.length
  for (const exp of expenses) {
    const c = classifications.find((x) => x.client_id === exp.id)
    if (!c || c.error?.trim()) continue
    if (c.evidence && c.evidence.length > 0) withEvidence++
  }
  return { withEvidence, total }
}

/** Média de trechos recuperados por linha que tem pelo menos uma evidência. */
export function avgEvidenceCountAmongLinesWithEvidence(
  classifications: ClassificationItem[],
): number | null {
  const ok = classifications.filter((c) => !c.error?.trim() && c.evidence && c.evidence.length > 0)
  if (ok.length === 0) return null
  const sum = ok.reduce((a, c) => a + (c.evidence?.length ?? 0), 0)
  return sum / ok.length
}

/** Linhas com nexo RAG ténue (analogia / ligação fraca). */
export function countTenuousNexusLines(classifications: ClassificationItem[]): number {
  let n = 0
  for (const c of classifications) {
    if (c.error?.trim()) continue
    if (isTenuousRagNexus(maxEvidenceSimilarity(c))) n++
  }
  return n
}
