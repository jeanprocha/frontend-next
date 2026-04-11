import { parseApiDecimal, toChartNumber } from "@/lib/money-decimal"
import type { ClassificationItem } from "@/types/api"

const MAX_LABEL = 48

/**
 * Heurística de narrativa RAG (peso por montante de despesa; partilha entre artigos na mesma linha).
 * Não substitui rateio do motor Go — não é percentagem de crédito fiscal.
 */
export function heuristicRagHeroArticle(
  expenses: { id: string; amount: string }[],
  classifications: ClassificationItem[],
): { articleLabel: string; weightSharePct: number } | null {
  const byArticle = new Map<string, number>()

  for (const c of classifications) {
    if (c.error) continue
    const cid = c.client_id?.trim()
    if (!cid) continue
    const exp = expenses.find((e) => e.id === cid)
    if (!exp) continue
    const d = parseApiDecimal(exp.amount)
    if (!d || d.lte(0)) continue
    const amt = toChartNumber(d)
    const evs = c.evidence?.filter((e) => e.article_id || e.metadata?.article_label)
    if (!evs?.length) continue
    const share = amt / evs.length
    for (const ev of evs) {
      const raw =
        ev.metadata?.article_label?.trim() ||
        ev.article_id?.trim() ||
        ""
      if (!raw) continue
      const label = raw.length > MAX_LABEL ? `${raw.slice(0, MAX_LABEL - 1)}…` : raw
      const prev = byArticle.get(label) ?? 0
      byArticle.set(label, prev + share)
    }
  }

  if (byArticle.size === 0) return null

  let bestLabel = ""
  let best = 0
  for (const [label, w] of byArticle) {
    if (w > best) {
      best = w
      bestLabel = label
    }
  }
  if (!bestLabel || best <= 0) return null

  const totalWeight = [...byArticle.values()].reduce((a, b) => a + b, 0)
  if (totalWeight <= 0) return null

  const weightSharePct = Math.round((best / totalWeight) * 100)
  return { articleLabel: bestLabel, weightSharePct }
}
