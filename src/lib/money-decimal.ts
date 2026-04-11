import Decimal from "decimal.js"

/**
 * Porto seguro para strings monetárias vindas da API (mesma semântica que o motor: decimal, não float).
 * Não recalcula imposto — só interpreta e compara valores já devolvidos pelo Go.
 */
export function parseApiDecimal(s: string | undefined | null): Decimal | null {
  if (s == null) return null
  const t = String(s).trim().replace(",", ".")
  if (t === "") return null
  try {
    return new Decimal(t)
  } catch {
    return null
  }
}

/** Fronteira Recharts / Nivo: primitivo number só para eixos e séries. */
export function toChartNumber(d: Decimal): number {
  return d.toNumber()
}

/**
 * Parse para gráficos: 0 se inválido (comportamento anterior de `parseFloat` em charts).
 */
export function parseApiDecimalForChart(s: string | undefined): number {
  const d = parseApiDecimal(s)
  return d ? toChartNumber(d) : 0
}
