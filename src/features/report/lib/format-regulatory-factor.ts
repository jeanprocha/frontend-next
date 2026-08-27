import { parseApiDecimal } from "@/lib/money-decimal"

/**
 * Formata fatores regulamentares 0–1 (strings do motor Go) como percentagem pt-BR.
 * Valores fora desse intervalo ou não numéricos devolvem o texto original (ex.: modelo ISS).
 */
export function formatRegulatoryFactorDisplay(raw: string | undefined | null): string {
  if (raw == null) return "—"
  const t = String(raw).trim()
  if (t === "" || t === "—") return "—"

  const v = parseApiDecimal(t)
  if (!v) return t

  if (v.lt(0) || v.gt(1)) return t

  const pct = v.mul(100)
  return `${pct.toFixed(2).replace(".", ",")}%`
}

/**
 * Formata "a / b" quando ambos são fatores decimais (ex. CBS / IBS).
 */
export function formatRegulatoryFactorPair(a: string, b: string): string {
  return `${formatRegulatoryFactorDisplay(a)} / ${formatRegulatoryFactorDisplay(b)}`
}
