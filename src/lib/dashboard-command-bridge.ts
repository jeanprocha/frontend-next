/**
 * Ponte leve entre a página do dashboard (onde vivem mutation e board-ready)
 * e o CommandMenu montado nos Providers globais.
 *
 * Rotas secundárias (histórico, empresas) podem usar `patchDashboardCommandBridge`
 * ao montar/desmontar para expor acções contextuais sem substituir o estado do simulador.
 */
export type DashboardCommandBridge = {
  runSimulation: (() => void) | null
  toggleBoardReady: (() => void) | null
  /** true quando estamos na fase de input do simulador (form manual, não CSV nem resultados) */
  isSimulationInputPhase: boolean
  /** Resultado form disponível para modo apresentação / impressão */
  hasFormResults: boolean
  isLoadingSimulation: boolean
  /** Histórico: focar campo de pesquisa / filtro da lista */
  focusHistorySearch: (() => void) | null
  /** Empresas: abrir fluxo “Nova empresa” */
  openCompaniesNewForm: (() => void) | null
}

const defaultBridge: DashboardCommandBridge = {
  runSimulation: null,
  toggleBoardReady: null,
  isSimulationInputPhase: false,
  hasFormResults: false,
  isLoadingSimulation: false,
  focusHistorySearch: null,
  openCompaniesNewForm: null,
}

let bridge: DashboardCommandBridge = defaultBridge

export function setDashboardCommandBridge(next: DashboardCommandBridge): void {
  bridge = next
}

/** Mescla campos sem apagar o restante (útil para rotas que só acrescentam slots). */
export function patchDashboardCommandBridge(
  patch: Partial<DashboardCommandBridge>,
): void {
  bridge = { ...bridge, ...patch }
}

export function clearDashboardCommandBridge(): void {
  bridge = defaultBridge
}

export function getDashboardCommandBridge(): DashboardCommandBridge {
  return bridge
}
