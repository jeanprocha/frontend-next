// Barrel público da feature simulation (FE-1). app/ e páginas só importam
// daqui — nunca de features/simulation/machine/* diretamente (lint de fronteira).
export { useSimulationPipeline } from "./machine/use-simulation-pipeline"
export type { SimulationPipeline, SimulationPipelineActions } from "./machine/use-simulation-pipeline"

export { SimulationDashboard } from "./components/simulation-dashboard"
export type { SimulationDashboardProps } from "./components/simulation-dashboard"

// FE-4 (PR 4c): o corpo de app/dashboard/history/page.tsx virou HistoryPageView
// — hidrata a máquina e chama simulationMachine.requestHistoryComparison por
// import relativo interno, sem precisar de indireção via barrel.
export { HistoryPageView } from "./components/history-page-view"
export type { HistoryPageViewProps } from "./components/history-page-view"

// FE-4 (PR 4d): lista de simulações de UM cliente — usada no workspace
// /clientes/[companyId], distinta do histórico global (HistoryPageView).
export { RegistrosDoCliente } from "./components/registros-do-cliente"
export type { RegistrosDoClienteProps } from "./components/registros-do-cliente"

export type {
  ClassifiedInput,
  FormResults,
  MachineState,
  PipelineFailure,
  SimulationInput,
} from "./machine/machine-types"

// Etapa N/PR 1: único ponto de hidratação a partir de um registo salvo —
// usado pelo histórico global (import relativo interno) e pelo workspace
// do cliente (app/, via este barrel).
export { hydrateSimulationFromRecord } from "./machine/hydrate-record"
