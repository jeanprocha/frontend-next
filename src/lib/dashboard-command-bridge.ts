/**
 * Ponte leve entre a página do dashboard (onde vivem mutation e board-ready)
 * e o CommandMenu montado nos Providers globais.
 */
export type DashboardCommandBridge = {
  runSimulation: (() => void) | null
  toggleBoardReady: (() => void) | null
  /** true quando estamos na fase de input do simulador (form manual, não CSV nem resultados) */
  isSimulationInputPhase: boolean
  /** Resultado form disponível para modo apresentação / impressão */
  hasFormResults: boolean
  isLoadingSimulation: boolean
}

const defaultBridge: DashboardCommandBridge = {
  runSimulation: null,
  toggleBoardReady: null,
  isSimulationInputPhase: false,
  hasFormResults: false,
  isLoadingSimulation: false,
}

let bridge: DashboardCommandBridge = defaultBridge

export function setDashboardCommandBridge(next: DashboardCommandBridge): void {
  bridge = next
}

export function clearDashboardCommandBridge(): void {
  bridge = defaultBridge
}

export function getDashboardCommandBridge(): DashboardCommandBridge {
  return bridge
}
