import type { SimulationResponse, TaxBreakdown } from "@/types/api"
import { parseApiDecimal } from "@/lib/money-decimal"

const MIN_Y = 2026
const MAX_Y = 2033

/** Reconstrói o veredito para o ano escolhido na curva (dados já calculados no backend). */
export function simulationAtFocusYear(
  base: SimulationResponse,
  focusYear: number,
): SimulationResponse {
  const y = Math.min(MAX_Y, Math.max(MIN_Y, focusYear))
  if (y === base.year) return base
  const pt = base.transition_series?.find((p) => p.year === y)
  if (!pt) return base

  const curNet = (pt.current?.net_tax?.trim() || pt.old_tax_net?.trim()) ?? ""
  const projNet = (pt.projected?.net_tax?.trim() || pt.new_tax_net?.trim()) ?? ""
  if (!curNet || !projNet) return base

  const current: TaxBreakdown =
    pt.current?.net_tax != null && pt.current.net_tax !== ""
      ? pt.current
      : { gross_tax: "0", credits: "0", net_tax: curNet }

  const projected: TaxBreakdown =
    pt.projected?.net_tax != null && pt.projected.net_tax !== ""
      ? pt.projected
      : { gross_tax: "0", credits: "0", net_tax: projNet }

  let delta = pt.delta
  let deltaPct = pt.delta_pct
  if (!delta?.trim()) {
    const a = parseApiDecimal(curNet)
    const b = parseApiDecimal(projNet)
    if (a && b) {
      const diff = b.sub(a)
      delta = diff.toFixed(2)
      if (!a.isZero()) {
        deltaPct = diff.div(a.abs()).mul(100).toFixed(2)
      }
    }
  }

  return {
    ...base,
    year: y,
    current,
    projected,
    delta: delta ?? base.delta,
    delta_pct: deltaPct ?? base.delta_pct,
  }
}

export function clampTransitionYear(y: number): number {
  return Math.min(MAX_Y, Math.max(MIN_Y, y))
}

/**
 * Anos com ponto na série de transição, ordenados e sem duplicatas — fonte
 * única para o controle canônico de ano de foco (D2/Frente D:
 * focus-year-control.tsx). Nunca hardcoda 2026–2033: cai para `[base.year]`
 * quando o registro não trouxe série (ex.: registro antigo sem
 * transition_series).
 */
export function availableFocusYears(base: SimulationResponse): number[] {
  const years = base.transition_series?.map((p) => p.year) ?? []
  const unique = Array.from(new Set(years)).sort((a, b) => a - b)
  return unique.length > 0 ? unique : [base.year]
}
