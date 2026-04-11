import { confidenceTierFromScore01 } from "@/lib/confidence-tiers"
import { getEffectiveExpenseSimulationFields } from "@/lib/classification-effective"
import type { ClassificationItem } from "@/types/api"

const REGIME_LABELS: Record<string, string> = {
  padrao: "Padrão",
  diferenciado_60: "Diferenciado",
  reduzido_zero: "Reduzido / zero",
}

function regimeLabel(key: string): string {
  return REGIME_LABELS[key] ?? key
}

export interface ClassificationAggregates {
  lineCount: number
  classifiedCount: number
  errorCount: number
  meanConfidence: number | null
  /** Pelo menos uma linha sem erro com tier vermelho (confiança baixa). */
  hasRedLine: boolean
  /** regime_type -> count */
  regimeCounts: { key: string; label: string; count: number; pct: number }[]
}

export function aggregateClassifications(
  classifications: ClassificationItem[],
): ClassificationAggregates {
  let errorCount = 0
  let sum = 0
  let n = 0
  let hasRedLine = false
  const counts = new Map<string, number>()

  for (const c of classifications) {
    if (c.error) {
      errorCount++
      continue
    }
    sum += c.confidence
    n++
    if (confidenceTierFromScore01(c.confidence) === "red") {
      hasRedLine = true
    }
    // Usar valor efectivo (override ou IA) para que os agregados reflictam
    // a decisão do consultor — consistência com os números do último recálculo Go.
    const k = getEffectiveExpenseSimulationFields(c).regime_type || "padrao"
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  const classifiedCount = n
  const meanConfidence = n > 0 ? sum / n : null
  const totalRegime = [...counts.values()].reduce((a, b) => a + b, 0)
  const regimeCounts = [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: regimeLabel(key),
      count,
      pct: totalRegime > 0 ? Math.round((count / totalRegime) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    lineCount: classifications.length,
    classifiedCount,
    errorCount,
    meanConfidence,
    hasRedLine,
    regimeCounts,
  }
}
