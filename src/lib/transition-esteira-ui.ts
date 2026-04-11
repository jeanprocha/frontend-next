import type { SimulationResponse } from "@/types/api"

/** Props agrupadas para a esteira (Motor Go + gráfico) — evita prop drilling. */
export interface TransitionEsteiraUi {
  /** Simulação completa para o gráfico e Sankey (série integral). */
  chartResult: SimulationResponse
  /** Cenário A em modo comparação — baseline para o gráfico. */
  abBaselineResult?: SimulationResponse
  transitionFocusYear: boolean
  transitionFullChart: boolean
  transitionAuditFactors: boolean
  transitionDynamicInsights: boolean
  onFocusYearChange?: (year: number) => void
}
