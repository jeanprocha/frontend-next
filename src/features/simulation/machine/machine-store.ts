// O motor da máquina (FE-1): store zustand vanilla em escopo de MÓDULO — não
// de componente. Isso é o que dá sobrevivência a navegação (HistoryPageView
// hidrata e navega para ROTAS.simulador/ROTAS.cliente; useReducer da página
// morreria no unmount). Timer de debounce ÚNICO aqui — elimina a corrida
// entre a instância da página e a do bridge que existia no código original
// (mudança deliberada FE-1 #4).
import { createStore } from "zustand/vanilla"
import type { SimulationRecordDetailResponse } from "@/types/api"
import { useTaxStore } from "@/store/useTaxStore"
import { transition } from "./transition"
import { runPersist, runRecalc } from "./steps"
import { PIPELINE_STEPS, stepById } from "./step-registry"
import { getStepCtx } from "./runtime"
import type { Command, FormResults, MachineEvent, MachineState, Step } from "./machine-types"

const DEBOUNCE_MS = 800

export interface PendingHistoryComparison {
  baseline: SimulationRecordDetailResponse
  current: SimulationRecordDetailResponse
}

interface MachineStoreState {
  fsm: MachineState
  pendingHistoryComparison: PendingHistoryComparison | null
}

const INITIAL_STATE: MachineState = { status: "idle", failure: null }

/**
 * Exportada só para testes (machine-store.test.ts) — instância isolada por
 * teste. `steps` é injetável (default: o registry real) para provar a
 * genericidade da máquina com um registry fake.
 */
export function createSimulationMachineStore(steps: readonly Step[] = PIPELINE_STEPS) {
  const store = createStore<MachineStoreState>(() => ({
    fsm: INITIAL_STATE,
    pendingHistoryComparison: null,
  }))

  let recalcTimer: ReturnType<typeof setTimeout> | null = null

  function cancelRecalcTimer(): void {
    if (recalcTimer) {
      clearTimeout(recalcTimer)
      recalcTimer = null
    }
  }

  function armRecalcTimer(): void {
    cancelRecalcTimer()
    recalcTimer = setTimeout(() => {
      recalcTimer = null
      void dispatchAndAwait({ type: "RECALC_DEBOUNCE_FIRED" })
    }, DEBOUNCE_MS)
  }

  function dispatchSync(event: MachineEvent): Command[] {
    const env = { presentationMode: useTaxStore.getState().presentationMode, steps }
    const { state, commands } = transition(store.getState().fsm, event, env)
    store.setState({ fsm: state })
    return commands
  }

  async function runCommand(cmd: Command): Promise<void> {
    switch (cmd.kind) {
      case "runStep": {
        const step = stepById(steps, cmd.stepId)
        // Impossível com o registry real (o reducer só emite runStep para
        // ids do próprio `steps`) — rede de segurança contra um registry mal
        // configurado (ex.: probe fake removido a meio de um run em curso).
        if (!step) return
        const outcome = await step.run(cmd.input, cmd.acc, getStepCtx())
        const event: MachineEvent = outcome.ok
          ? { type: "STEP_SUCCEEDED", stepId: cmd.stepId, acc: outcome.acc }
          : { type: "STEP_FAILED", stepId: cmd.stepId, error: outcome.error }
        await dispatchAndAwait(event)
        return
      }
      case "recalc": {
        const current = store.getState().fsm
        if (current.status !== "ready") return
        const event = await runRecalc(current.results, getStepCtx())
        await dispatchAndAwait(event)
        return
      }
      case "persist": {
        const current = store.getState().fsm
        if (current.status !== "ready") return
        const event = await runPersist(
          cmd.origin,
          current.results,
          { discoveredTags: cmd.discoveredTags, reportBrand: cmd.reportBrand },
          getStepCtx(),
        )
        await dispatchAndAwait(event)
        return
      }
      case "armRecalcDebounce":
        armRecalcTimer()
        return
      case "cancelRecalcDebounce":
        cancelRecalcTimer()
        return
    }
  }

  async function dispatchAndAwait(event: MachineEvent): Promise<void> {
    const commands = dispatchSync(event)
    await Promise.all(commands.map(runCommand))
  }

  /** Entrada pública fire-and-forget — usada pelos handlers de UI. */
  function dispatch(event: MachineEvent): void {
    void dispatchAndAwait(event)
  }

  /**
   * Fluxo do dossiê digital: replica handleOpenDossier passo a passo (FE-1).
   * Garante persistência (com recalc pendente embutido, se houver) e devolve
   * o link público — abre em nova aba, ou copia para a área de transferência
   * com `copyOnly` (D3/Frente D — "Copiar link do dossiê", mesmo fluxo do
   * "Gerar Dossiê digital", só muda o destino final da URL).
   *
   * Falha ao persistir (o caso real de produção) já chega como evento
   * PERSIST_FAILED normal — dispatchAndAwait/runCommand nunca lançam por
   * isso, então o reducer põe lastPersistError no estado e a UI reage via
   * use-simulation-pipeline (Etapa M/PR 8; antes esse resultado também caía
   * em silêncio aqui). Este catch cobre só o resto — exceção genuína no
   * fluxo (ex.: getToken() lançando) — e agora também vira lastPersistError,
   * não só log: sem isso, um erro nesse trecho específico continuaria mudo
   * para quem está olhando a tela, mesmo com o reducer já corrigido.
   */
  async function openDossier(opts: {
    reportBrand: { logo_url?: string | null; org_name?: string | null } | null
    copyOnly?: boolean
  }): Promise<string | null> {
    if (store.getState().fsm.status !== "ready") return null
    dispatchSync({ type: "DOSSIER_STARTED" })
    try {
      const token = await getStepCtx().getToken()
      if (!token) return null

      const beforeRecalc = store.getState().fsm
      if (beforeRecalc.status === "ready" && beforeRecalc.sync.pendingSync) {
        cancelRecalcTimer()
        await dispatchAndAwait({ type: "RECALC_REQUESTED" })
      }

      const current = store.getState().fsm
      if (current.status !== "ready") return null
      if (!current.results.meta?.recordId) {
        await runCommand({ kind: "persist", origin: "dossier", reportBrand: opts.reportBrand })
      }

      const afterPersist = store.getState().fsm
      const recordId = afterPersist.status === "ready" ? afterPersist.results.meta?.recordId : undefined
      if (!recordId) return null
      // window.location só é tocado no ramo copyOnly — o ramo "abrir nova
      // aba" (o caminho já coberto por machine-store.test.ts, ambiente node
      // sem window.location real) nunca precisou da URL absoluta.
      if (opts.copyOnly) {
        const url = `${window.location.origin}/report/${recordId}`
        await navigator.clipboard.writeText(url)
        return url
      }
      window.open(`/report/${recordId}`, "_blank", "noopener,noreferrer")
      return recordId
    } catch (e) {
      console.error("[TribIA] Dossié digital:", e)
      dispatchSync({ type: "PERSIST_FAILED", error: e, origin: "dossier", extra: { reportBrand: opts.reportBrand } })
      return null
    } finally {
      dispatchSync({ type: "DOSSIER_FINISHED" })
    }
  }

  return {
    store,
    dispatch,
    cancelRecalcTimer,
    openDossier,
    setPendingHistoryComparison(v: PendingHistoryComparison | null) {
      store.setState({ pendingHistoryComparison: v })
    },
    /** history/page.tsx: abrir um registro do histórico. */
    hydrateResults(results: FormResults) {
      dispatch({ type: "HYDRATED", results })
    },
    /** history/page.tsx: comparar 2 registros — o dashboard consome e limpa. */
    requestHistoryComparison(baseline: SimulationRecordDetailResponse, current: SimulationRecordDetailResponse) {
      store.setState({ pendingHistoryComparison: { baseline, current } })
    },
  }
}

export const simulationMachine = createSimulationMachineStore()

export type { FormResults }
