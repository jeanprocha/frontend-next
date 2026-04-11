import type { TransitionSeriesPoint } from "@/types/api"
import { parseApiDecimal } from "@/lib/money-decimal"

/** Chave para tooltips de fatores regulamentares na memória de cálculo. */
export type FactorAuditKind =
  | "pis_cofins"
  | "iss_municipal"
  | "cbs"
  | "ibs"
  | "combined"
  | "iss_model"

/**
 * Explica o peso/alíquota no contexto da transição e convivência de regimes (ano de foco).
 */
export function factorTransitionAuditTooltip(focusYear: number, kind: FactorAuditKind): string {
  const convivencia =
    focusYear >= 2026 && focusYear <= 2033
      ? ` Este parâmetro aplica-se ao ano ${focusYear} dentro da série de transição modelada (convivência de regimes legado e CBS/IBS).`
      : ""
  const y2028 =
    focusYear === 2028
      ? " Em 2028 a convivência de regimes é particularmente relevante para a leitura dos pesos e alíquotas efectivos."
      : ""

  switch (kind) {
    case "pis_cofins":
      return `Factor de manutenção no bloco legado (PIS/COFINS) usado pelo motor Go para ${focusYear}; determinístico, sem ponto flutuante binário na conta central.${convivencia}${y2028}`
    case "iss_municipal":
      return `Factor sobre a alíquota de ISS informada, conforme o modelo municipal no motor para ${focusYear}.${convivencia}`
    case "cbs":
      return `Alíquota CBS de referência do ano ${focusYear} no modelo TribIA (regime de destino).${convivencia}${y2028}`
    case "ibs":
      return `Alíquota IBS de referência do ano ${focusYear} no modelo TribIA (regime de destino).${convivencia}${y2028}`
    case "combined":
      return `Alíquota combinada CBS+IBS de referência para ${focusYear}; usada na leitura de créditos e carga no bloco destino durante a rampa de transição.${convivencia}${y2028}`
    case "iss_model":
      return `Identificador do modelo de ISS municipal aplicado neste cenário (motor Go); não é uma alíquota numérica.`
    default:
      return `Parâmetro determinístico do motor Go para ${focusYear}.`
  }
}

/** Texto educativo: por que créditos CBS/IBS podem parecer baixos nos primeiros anos da transição. */
export function explainDestinationCredits(
  focusYear: number,
  point: TransitionSeriesPoint | undefined,
): string | null {
  if (!point?.factors) return null
  const f = point.factors
  const combined = parseApiDecimal(String(f.combined_projected_rate ?? "0"))
  const creditsStr = point.projected?.credits?.trim()
  const grossStr = point.projected?.gross_tax?.trim()
  const credits = creditsStr ? parseApiDecimal(creditsStr) : null
  const gross = grossStr ? parseApiDecimal(grossStr) : null

  const parts: string[] = []
  if (focusYear >= 2026 && focusYear <= 2028 && combined && combined.lt("0.12")) {
    parts.push(
      `No modelo TribIA, a alíquota CBS+IBS de referência em ${focusYear} ainda está em rampa (${f.combined_projected_rate ?? "—"}). Créditos sobre despesas elegíveis seguem essa mesma lógica de alíquota efetiva; por isso o montante absoluto de créditos do bloco destino pode parecer modesto em relação à receita, sem indicar erro de cálculo.`,
    )
  } else if (credits && gross && gross.gt(0)) {
    const ratio = credits.div(gross)
    if (ratio.lt("0.05") && combined && combined.gt(0)) {
      parts.push(
        "A proporção créditos/bruto no destino reflete despesas elegíveis e a alíquota efetiva do ano; em anos de alíquota plena mais alta, o mesmo volume de insumos tende a gerar créditos maiores em valor absoluto.",
      )
    }
  }
  if (parts.length === 0) return null
  return parts.join(" ")
}
