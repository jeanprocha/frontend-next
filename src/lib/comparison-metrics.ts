import Decimal from "decimal.js"
import type { SimulationResponse, TransitionSeriesPoint } from "@/types/api"
import { parseApiDecimal } from "@/lib/money-decimal"

/**
 * Diferença de carga líquida projetada (CBS/IBS): cenário B − cenário A.
 * Negativo = B paga menos que A (economia vs referência).
 */
export function projectedNetTaxDiff(baseline: SimulationResponse, current: SimulationResponse): number {
  const b = parseApiDecimal(current.projected.net_tax)
  const a = parseApiDecimal(baseline.projected.net_tax)
  if (!b || !a) return Number.NaN
  return b.sub(a).toNumber()
}

/**
 * Soma ano a ano de (new_tax_net B − new_tax_net A) nos anos em comum.
 */
export function accumulatedNewTaxDiff(
  baselineSeries: TransitionSeriesPoint[] | undefined,
  currentSeries: TransitionSeriesPoint[] | undefined,
): number | null {
  if (!baselineSeries?.length || !currentSeries?.length) return null
  const byYear = new Map<number, string>()
  for (const p of baselineSeries) {
    byYear.set(p.year, p.new_tax_net)
  }
  let sum = new Decimal(0)
  let count = 0
  for (const p of currentSeries) {
    const a = byYear.get(p.year)
    if (a === undefined) continue
    const pb = parseApiDecimal(p.new_tax_net)
    const pa = parseApiDecimal(a)
    if (!pb || !pa) continue
    sum = sum.add(pb.sub(pa))
    count++
  }
  return count > 0 ? sum.toNumber() : null
}

export function formatRegimeLabel(regime: string | undefined): string {
  if (!regime) return "—"
  const map: Record<string, string> = {
    regular: "Lucro Real / Presumido",
    mei: "MEI",
    simples_puro: "Simples puro",
    simples_hibrido: "Simples híbrido",
    diferenciado_60: "Saúde / educação / cultura",
    aliquota_zero: "Alíquota zero",
    exportadora: "Exportadora",
    entidade_imune: "Entidade imune",
    imobiliario_venda: "Imobiliário (venda)",
    imobiliario_aluguel: "Imobiliário (aluguel)",
    prof_liberal: "Profissional liberal",
  }
  return map[regime] ?? regime
}
