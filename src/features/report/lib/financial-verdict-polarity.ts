/**
 * Derivação de polaridade do veredito financeiro.
 *
 * MANTRA (tribia_core_rules §1 — "IA Explica; Go Calcula"):
 *   Este módulo não recalcula nem estima impostos.
 *   Apenas classifica o sinal do campo `delta` já calculado pelo motor Go
 *   e devolvido como string decimal na resposta da API.
 *
 * PRECISÃO (zero float64):
 *   A polaridade é derivada exclusivamente via `parseApiDecimal` + comparações
 *   `Decimal` (biblioteca shopspring/decimal, mesma semântica do backend Go).
 *
 *   Por que NÃO usar `parseFloat` nem checar o primeiro caractere "-":
 *   - `parseFloat("-0.00")` retorna -0, que `< 0` é falso em JS — classificaria
 *     como neutro **acidentalmente**, não por regra explícita.
 *   - A string "-0.00" inicia com "-" mas representa **zero económico** — o motor
 *     Go pode emiti-la em transições onde o delta é matematicamente zero após
 *     arredondamento decimal. Prefixo "-" isolado = falso negativo.
 *   - `Decimal("-0.00").isZero()` retorna true — comportamento correcto e
 *     determinístico, espelhando a aritmética `shopspring/decimal` do Go.
 */

import { parseApiDecimal } from "@/lib/money-decimal"

export type FinancialVerdictPolarity = "economy" | "increase" | "neutral" | "invalid"

/**
 * Classifica o delta devolvido pelo motor Go em uma de quatro polaridades.
 *
 * @param rawDelta - String decimal vinda directamente de `simulation.delta` (API Go).
 *   Pode ser `undefined` (campo ausente em registos antigos) ou `null`.
 * @returns
 *   - `"economy"`  — delta < 0 (carga projetada menor que a actual)
 *   - `"increase"` — delta > 0 (carga projetada maior que a actual)
 *   - `"neutral"`  — delta == 0 (inclui "-0.00" e "0.000")
 *   - `"invalid"`  — string ausente, vazia ou não parseável como decimal
 */
export function deriveFinancialVerdictPolarity(
  rawDelta: string | undefined | null,
): FinancialVerdictPolarity {
  if (rawDelta == null) return "invalid"

  const trimmed = rawDelta.trim()
  if (trimmed === "") return "invalid"

  const d = parseApiDecimal(trimmed)
  if (d === null) return "invalid"

  if (d.isZero()) return "neutral"
  if (d.lt(0)) return "economy"
  return "increase"
}
