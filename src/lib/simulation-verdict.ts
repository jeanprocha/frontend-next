import { formatBRL } from "@/lib/format-money"
import { parseApiDecimal } from "@/lib/money-decimal"
import type { SimulationResponse } from "@/types/api"

export function parseNet(s: string): string {
  const d = parseApiDecimal(s)
  return d ? d.toFixed(2) : s
}

/** Delta projetado − atual (negativo = economia). */
export function simulationDeltaValue(sim: SimulationResponse): number {
  let deltaD = parseApiDecimal(sim.delta?.trim())
  const projD = parseApiDecimal(sim.projected.net_tax)
  const currD = parseApiDecimal(sim.current.net_tax)
  if (!deltaD && projD && currD) {
    deltaD = projD.sub(currD)
  }
  return deltaD ? deltaD.toNumber() : Number.NaN
}

/**
 * Extraído de comparison-verdict-card.tsx (Frente A / item A2 — o arquivo já
 * excede o teto de 300 linhas; "ao tocar, extrair em vez de aumentar").
 * Pura, sem JSX — cabe aqui ao lado de `singleVereditoSentence`.
 */
export function singleRacionalBody(lawLabel: string, ragSources?: string[] | null): string {
  const base = `A simulação parte das premissas do modelo TribIA para a ${lawLabel}, com regimes de transição e elegibilidade a créditos conforme o quadro legal aplicável (incluindo Art. 131 da ${lawLabel}, no âmbito do modelo).`
  if (ragSources && ragSources.length > 0) {
    const list = ragSources.slice(0, 6).join(", ")
    const more = ragSources.length > 6 ? ` (+${ragSources.length - 6} outras)` : ""
    return `${base} Dispositivos legais com maior peso na análise: ${list}${more}.`
  }
  return `${base} Sem lista de artigos consolidada neste registro — valide premissas com a área fiscal.`
}

export function singleVereditoSentence(sim: SimulationResponse): string {
  const deltaValue = simulationDeltaValue(sim)
  const neutral = !Number.isFinite(deltaValue) || deltaValue === 0
  const saving = deltaValue < 0
  const absDeltaStr = Math.abs(deltaValue).toFixed(2)
  if (neutral) {
    return "Não há variação material entre a carga líquida tributária atual estimada e a CBS/IBS projetada para o ano da simulação."
  }
  if (saving) {
    return `Economia potencial projetada de ${formatBRL(absDeltaStr)} na transição para CBS/IBS frente ao quadro atual estimado.`
  }
  return `Custo adicional projetado de ${formatBRL(absDeltaStr)} na transição para CBS/IBS frente ao quadro atual estimado.`
}
