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

export function singleVereditoSentence(sim: SimulationResponse): string {
  const deltaValue = simulationDeltaValue(sim)
  const neutral = !Number.isFinite(deltaValue) || deltaValue === 0
  const saving = deltaValue < 0
  const absDeltaStr = Math.abs(deltaValue).toFixed(2)
  if (neutral) {
    return "Não há variação material entre a carga líquida tributária atual estimada e a CBS/IBS projetada para o ano da simulação."
  }
  if (saving) {
    return `Economia potencial projetada de ${formatBRL(absDeltaStr)} na transição para CBS/IBS face ao quadro atual estimado.`
  }
  return `Custo adicional projetado de ${formatBRL(absDeltaStr)} na transição para CBS/IBS face ao quadro atual estimado.`
}
