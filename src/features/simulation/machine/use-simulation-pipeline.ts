"use client"

import { useEffect, useMemo } from "react"
import { useStore } from "zustand/react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-client"
import { useTribiaPlgTier } from "@/hooks/use-tribia-plg-tier"
import type { ConsultantClassificationOverride } from "@/types/api"
import { simulationMachine } from "./machine-store"
import { setRuntimeCtx } from "./runtime"
import type { FormResults, PipelineFailure, SimulationInput } from "./machine-types"

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
  openDossier(opts: { reportBrand: { logo_url?: string | null; org_name?: string | null } | null }): Promise<void>
  /** Consome pendingHistoryComparison — quem chama já leu o valor. */
  consumeHistoryComparison(): void
}

export interface SimulationPipeline {
  results: FormResults | null
  isRunning: boolean
  failure: PipelineFailure | null
  pendingSync: boolean
  isRecalculating: boolean
  dossierBusy: boolean
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
      openDossier: (opts) => simulationMachine.openDossier(opts),
      consumeHistoryComparison: () => simulationMachine.setPendingHistoryComparison(null),
    }),
    [],
  )

  const results = fsm.status === "ready" ? fsm.results : null
  const isRunning = fsm.status === "classifying" || fsm.status === "calculating"
  const failure = fsm.status === "idle" ? fsm.failure : null
  const pendingSync = fsm.status === "ready" && fsm.sync.pendingSync
  const isRecalculating = fsm.status === "ready" && fsm.sync.recalc === "in-flight"
  const dossierBusy = fsm.status === "ready" && fsm.dossierBusy

  return {
    results,
    isRunning,
    failure,
    pendingSync,
    isRecalculating,
    dossierBusy,
    pendingHistoryComparison,
    actions,
  }
}
