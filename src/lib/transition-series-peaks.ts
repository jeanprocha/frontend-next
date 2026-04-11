import type { TransitionSeriesPoint } from "@/types/api"
import { parseApiDecimal } from "@/lib/money-decimal"

type ApiDecimal = NonNullable<ReturnType<typeof parseApiDecimal>>

/** @deprecated Preferir parseApiDecimal; mantido para testes de normalização. */
export function parseTransitionMoney(s: string | undefined): number {
  const d = parseApiDecimal(s)
  return d ? d.toNumber() : Number.NaN
}

export interface PeakYearResult {
  year: number
  /** Valor canónico em string decimal (ex.: "500.00") alinhado ao motor. */
  value: string
}

/**
 * Ano em que `new_tax_net` (carga CBS/IBS líquida projectada) é máximo na série.
 * Empates: desempata pelo ano mais cedo (determinístico).
 */
export function peakYearMaxDestinationNet(series: TransitionSeriesPoint[] | undefined): PeakYearResult | null {
  if (!series?.length) return null
  let bestYear: number | null = null
  let bestVal: ApiDecimal | null = null
  for (const p of series) {
    const v = parseApiDecimal(p.new_tax_net)
    if (!v) continue
    if (
      bestYear === null ||
      bestVal === null ||
      v.gt(bestVal) ||
      (v.eq(bestVal) && p.year < bestYear)
    ) {
      bestVal = v
      bestYear = p.year
    }
  }
  if (bestYear === null || bestVal === null) return null
  return { year: bestYear, value: bestVal.toFixed(2) }
}

/**
 * Ano em que `delta` (projetado − legado no ponto da série) é máximo em valor algébrico.
 * Empates: ano mais cedo.
 */
export function peakYearMaxDelta(series: TransitionSeriesPoint[] | undefined): PeakYearResult | null {
  if (!series?.length) return null
  let bestYear: number | null = null
  let bestVal: ApiDecimal | null = null
  for (const p of series) {
    const v = parseApiDecimal(p.delta)
    if (!v) continue
    if (
      bestYear === null ||
      bestVal === null ||
      v.gt(bestVal) ||
      (v.eq(bestVal) && p.year < bestYear)
    ) {
      bestVal = v
      bestYear = p.year
    }
  }
  if (bestYear === null || bestVal === null) return null
  return { year: bestYear, value: bestVal.toFixed(2) }
}
