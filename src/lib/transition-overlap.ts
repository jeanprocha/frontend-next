/**
 * Lógica de domínio para o período de convivência (Dual Compliance) da Reforma Tributária.
 *
 * Fonte de verdade: `factors` devolvidos pelo motor Go (RulesForYear / toTransitionSeriesPoints).
 * O frontend apenas desenha o que o Go declarou — nunca recomputa alíquotas.
 * Comparações via Decimal.js (parseApiDecimal): zero float64 em operações financeiras.
 */
import type { TransitionSeriesPoint } from "@/types/api"
import { parseApiDecimal } from "@/lib/money-decimal"

/**
 * Determina se um ponto da série está em período de convivência (Dual Compliance).
 *
 * Condição (equivalência ao α do modelo TribIA, onde 0 < αₜ < 1):
 *   1. cbs_rate + ibs_rate > 0  — CBS/IBS já incide no modelo para este ano
 *   2. pis_cofins_factor > 0 OU iss_municipal_factor > 0 — componente legado ainda vigente
 *
 * Inclui `iss_municipal_factor` por integridade normativa:
 * em 2032 o PIS/COFINS já zerou (fator 0.000000), mas o ISS municipal ainda convive
 * (fator 0.200000 em ISSMunicipalTransitionFactor do Go). Omitir ISS encerraria a
 * sombra um ano antes da realidade do modelo.
 *
 * Pontos sem `factors` (registos históricos não enriquecidos) retornam false silenciosamente.
 */
export function isDualCompliancePoint(p: TransitionSeriesPoint): boolean {
  const f = p.factors
  if (!f) return false

  const cbs = parseApiDecimal(f.cbs_rate)
  const ibs = parseApiDecimal(f.ibs_rate)
  const pisCofins = parseApiDecimal(f.pis_cofins_factor)
  const issMunicipal = parseApiDecimal(f.iss_municipal_factor)

  const newRegimeActive = cbs !== null && ibs !== null && cbs.plus(ibs).gt(0)
  const oldRegimeActive =
    (pisCofins !== null && pisCofins.gt(0)) ||
    (issMunicipal !== null && issMunicipal.gt(0))

  return newRegimeActive && oldRegimeActive
}

export interface OverlapBand {
  startYear: number
  endYear: number
}

/**
 * Calcula a banda de convivência (startYear / endYear) a partir da série ordenada por `year`.
 * Retorna `null` se nenhum ponto satisfaz a condição — sinal para não renderizar a sombra.
 */
export function computeOverlapBand(
  series: TransitionSeriesPoint[] | undefined,
): OverlapBand | null {
  if (!series?.length) return null

  const sorted = [...series].sort((a, b) => a.year - b.year)
  const dualYears = sorted.filter(isDualCompliancePoint).map((p) => p.year)
  if (!dualYears.length) return null

  return { startYear: dualYears[0], endYear: dualYears[dualYears.length - 1] }
}

/**
 * Conjunto de anos em convivência — fonte partilhada com computeOverlapBand.
 * Usada no tooltip para verificação O(1) sem re-filtrar a série.
 */
export function buildDualComplianceYearSet(
  series: TransitionSeriesPoint[] | undefined,
): Set<number> {
  if (!series?.length) return new Set()
  return new Set(series.filter(isDualCompliancePoint).map((p) => p.year))
}
