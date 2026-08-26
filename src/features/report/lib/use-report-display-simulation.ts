"use client"

import type { SimulationResponse } from "@/types/api"
import { simulationAtFocusYear } from "@/lib/transition-focus"
import { useCapability } from "@/features/plg"

/**
 * Simulação "de cartão" — reconstruída para o ano de foco quando o plano
 * sincroniza o selector com os cards (transitionFocusYear, Pro+); Free
 * mostra sempre o ano em que a simulação foi corrida.
 */
export function useReportDisplaySimulation(
  base: SimulationResponse,
  focusYear: number,
): SimulationResponse {
  const transitionFocusYear = useCapability("transitionFocusYear")
  return transitionFocusYear ? simulationAtFocusYear(base, focusYear) : base
}
