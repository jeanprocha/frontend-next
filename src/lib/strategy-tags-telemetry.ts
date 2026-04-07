/**
 * Telemetria de produto para Strategy Chips — só chaves taxonómicas (pattern/label normalizados),
 * sem texto livre do contexto da empresa (Plano 05 / LGPD).
 */
export interface StrategyTagTelemetryPayload {
  pattern_key: string
  label_key: string
}

function dispatch(name: "tribia:strategy_tag_suggested" | "tribia:strategy_tag_confirmed", detail: StrategyTagTelemetryPayload) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(name, { detail }))
  if (process.env.NODE_ENV === "development") {
    console.debug(`[TribIA telemetry] ${name}`, detail)
  }
}

/** Chip reconhecido pelo dicionário local/cache (match instantâneo). */
export function emitStrategyTagSuggested(payload: StrategyTagTelemetryPayload): void {
  if (!payload.pattern_key) return
  dispatch("tribia:strategy_tag_suggested", payload)
}

/** Nova tag persistida / devolvida pela API após classificação. */
export function emitStrategyTagConfirmed(payload: StrategyTagTelemetryPayload): void {
  if (!payload.pattern_key) return
  dispatch("tribia:strategy_tag_confirmed", payload)
}
