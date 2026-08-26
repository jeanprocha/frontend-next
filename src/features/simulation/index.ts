// Barrel público da feature simulation (FE-1). app/ e páginas só importam
// daqui — nunca de features/simulation/machine/* diretamente (lint de fronteira).
import { simulationMachine } from "./machine/machine-store"
import type { FormResults } from "./machine/machine-types"
import type { SimulationRecordDetailResponse } from "@/types/api"

export { useSimulationPipeline } from "./machine/use-simulation-pipeline"
export type { SimulationPipeline, SimulationPipelineActions } from "./machine/use-simulation-pipeline"

export { SimulationDashboard } from "./components/simulation-dashboard"
export type { SimulationDashboardProps } from "./components/simulation-dashboard"

export type {
  ClassifiedInput,
  FormResults,
  MachineState,
  PipelineFailure,
  SimulationInput,
} from "./machine/machine-types"

/** history/page.tsx: abrir um registro do histórico (hidrata a máquina + navega). */
export function hydrateSimulationResults(results: FormResults): void {
  simulationMachine.hydrateResults(results)
}

/** history/page.tsx: comparar 2 registros — o dashboard consome e limpa via pendingHistoryComparison. */
export function requestHistoryComparison(
  baseline: SimulationRecordDetailResponse,
  current: SimulationRecordDetailResponse,
): void {
  simulationMachine.requestHistoryComparison(baseline, current)
}
