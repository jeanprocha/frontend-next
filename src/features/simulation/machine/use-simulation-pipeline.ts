"use client"

import { useEffect, useMemo } from "react"
import { useStore } from "zustand/react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-client"
import { useTribiaPlgTier } from "@/features/plg"
import type { ConsultantClassificationOverride } from "@/types/api"
import { simulationMachine } from "./machine-store"
import { setRuntimeCtx } from "./runtime"
import { PIPELINE_STEPS, stepById } from "./step-registry"
import type { FormResults, PipelineFailure, PipelineUiStage, SimulationInput, StepId } from "./machine-types"

export interface SimulationPipelineActions {
  /** Dispara o pipeline completo: classificar → calcular → salvar. */
  runSimulation(input: SimulationInput): void
  /** «Nova simulação» — volta a idle. */
  reset(): void
  /** Comparação A/B «Ajustar parâmetros» — limpa resultados sem tocar no formulário. */
  clearResults(): void
  applyOverride(clientId: string, override: ConsultantClassificationOverride): void
  removeOverride(clientId: string): void
  clearAllOverrides(): void
  /** CTA manual "Recalcular impacto". */
  requestRecalc(): void
  /** Retry manual após lastPersistError (Etapa M/PR 8) — reemite a mesma origem que falhou. */
  retryPersist(): void
  openDossier(opts: { reportBrand: { logo_url?: string | null; org_name?: string | null } | null }): Promise<void>
  /** Consome pendingHistoryComparison — quem chama já leu o valor. */
  consumeHistoryComparison(): void
  /**
   * Reidrata a máquina a partir de um registo já carregado (abrir do
   * histórico global ou do workspace do cliente, FE-4) — pula classify/
   * simulate direto para `ready`. app/ não pode deep-importar machine-store,
   * daí a action aqui em vez de um free function no barrel.
   */
  hydrateResults(results: FormResults): void
}

export interface SimulationPipeline {
  results: FormResults | null
  isRunning: boolean
  /** Id do passo em execução, ou `null` fora de `running` (PR 3b — consumido por use-pipeline-stage na 3d). */
  runningStepId: StepId | null
  /** Estágio de UI do passo em execução — `null` fora de `running`. */
  runningUiStage: PipelineUiStage | null
  failure: PipelineFailure | null
  pendingSync: boolean
  isRecalculating: boolean
  dossierBusy: boolean
  /** Etapa M/PR 8 — antes existia no estado interno da máquina, sem chegar à UI. */
  lastRecalcError: unknown | null
  lastPersistError: unknown | null
  pendingHistoryComparison: ReturnType<typeof simulationMachine.store.getState>["pendingHistoryComparison"]
  actions: SimulationPipelineActions
}

export function useSimulationPipeline(): SimulationPipeline {
  const { getToken, userId } = useAuth()
  const plan = useTribiaPlgTier()
  const queryClient = useQueryClient()

  const fsm = useStore(simulationMachine.store, (s) => s.fsm)
  const pendingHistoryComparison = useStore(simulationMachine.store, (s) => s.pendingHistoryComparison)

  // Ctx sempre fresco — registado a cada render, como o padrão já usado pelo
  // seam de auth (@/lib/auth-client). Nenhum passo assíncrono deve capturar
  // uma closure obsoleta de getToken/userId/plan.
  setRuntimeCtx({ getToken, userId, plan, queryClient })

  // Cancela o timer de debounce ao desmontar o dashboard — mesmo cleanup que
  // o SimulationRecalcBridge original fazia no unmount.
  useEffect(() => {
    return () => simulationMachine.cancelRecalcTimer()
  }, [])

  const actions = useMemo<SimulationPipelineActions>(
    () => ({
      runSimulation: (input) => simulationMachine.dispatch({ type: "RUN_REQUESTED", input }),
      reset: () => simulationMachine.dispatch({ type: "RESET" }),
      clearResults: () => simulationMachine.dispatch({ type: "RESULTS_CLEARED" }),
      applyOverride: (clientId, override) =>
        simulationMachine.dispatch({ type: "OVERRIDE_APPLIED", clientId, override }),
      removeOverride: (clientId) => simulationMachine.dispatch({ type: "OVERRIDE_REMOVED", clientId }),
      clearAllOverrides: () => simulationMachine.dispatch({ type: "OVERRIDES_CLEARED" }),
      requestRecalc: () => simulationMachine.dispatch({ type: "RECALC_REQUESTED" }),
      retryPersist: () => simulationMachine.dispatch({ type: "PERSIST_RETRY_REQUESTED" }),
      openDossier: (opts) => simulationMachine.openDossier(opts),
      consumeHistoryComparison: () => simulationMachine.setPendingHistoryComparison(null),
      hydrateResults: (results) => simulationMachine.hydrateResults(results),
    }),
    [],
  )

  const results = fsm.status === "ready" ? fsm.results : null
  const isRunning = fsm.status === "running"
  const runningStepId = fsm.status === "running" ? fsm.stepId : null
  const runningUiStage = runningStepId ? (stepById(PIPELINE_STEPS, runningStepId)?.uiStage ?? null) : null
  const failure = fsm.status === "idle" ? fsm.failure : null
  const pendingSync = fsm.status === "ready" && fsm.sync.pendingSync
  const isRecalculating = fsm.status === "ready" && fsm.sync.recalc === "in-flight"
  const dossierBusy = fsm.status === "ready" && fsm.dossierBusy
  const lastRecalcError = fsm.status === "ready" ? fsm.sync.lastRecalcError : null
  const lastPersistError = fsm.status === "ready" ? fsm.sync.lastPersistError : null

  return {
    results,
    isRunning,
    runningStepId,
    runningUiStage,
    failure,
    pendingSync,
    isRecalculating,
    dossierBusy,
    lastRecalcError,
    lastPersistError,
    pendingHistoryComparison,
    actions,
  }
}
