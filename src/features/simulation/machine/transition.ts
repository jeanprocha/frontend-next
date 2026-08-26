// Reducer puro da máquina do pipeline (FE-1). Sem I/O, sem timers reais —
// side effects são comandos que o runtime/machine-store executam. Ver
// docs/arquitetura-frontend.md §12 (FE-1) para a tabela de transições.
import type { MachineEnv, MachineEvent, MachineState, TransitionResult } from "./machine-types"
import { applyOverrideEvent } from "./overrides"

const NO_OP = (state: MachineState): TransitionResult => ({ state, commands: [] })

export function transition(state: MachineState, event: MachineEvent, env: MachineEnv): TransitionResult {
  switch (event.type) {
    case "RUN_REQUESTED": {
      if (state.status !== "idle") return NO_OP(state)
      return {
        state: { status: "classifying", input: event.input },
        commands: [{ kind: "classify", input: event.input }],
      }
    }

    case "CLASSIFY_SUCCEEDED": {
      if (state.status !== "classifying") return NO_OP(state)
      return {
        state: { status: "calculating", input: state.input, classified: event.classified },
        commands: [{ kind: "simulate", input: state.input, classified: event.classified }],
      }
    }

    case "CLASSIFY_FAILED": {
      if (state.status !== "classifying") return NO_OP(state)
      return { state: { status: "idle", failure: { step: "classify", error: event.error } }, commands: [] }
    }

    case "SIMULATE_SUCCEEDED": {
      if (state.status !== "calculating") return NO_OP(state)
      return {
        state: {
          status: "ready",
          results: event.results,
          sync: { pendingSync: false, recalc: "idle", lastRecalcError: null },
          dossierBusy: false,
        },
        commands: [{ kind: "persist", origin: "initial" }],
      }
    }

    case "SIMULATE_FAILED": {
      if (state.status !== "calculating") return NO_OP(state)
      return { state: { status: "idle", failure: { step: "simulate", error: event.error } }, commands: [] }
    }

    case "OVERRIDE_APPLIED":
    case "OVERRIDE_REMOVED":
    case "OVERRIDES_CLEARED": {
      if (state.status !== "ready") return NO_OP(state)
      const nextResults = applyOverrideEvent(state.results, event)
      // OVERRIDES_CLEARED sem overrides existentes → mesma referência, no-op
      // (preserva `if (!hasAny) return` do store original).
      if (nextResults === state.results) return NO_OP(state)

      const withOverride: MachineState = {
        ...state,
        results: nextResults,
        sync: { ...state.sync, pendingSync: true },
      }

      // Guarda Board-Ready (bridge original, ordem preservada): presentationMode
      // suspende o auto-recalc — cancela qualquer timer em curso, não reagenda.
      if (env.presentationMode) {
        return { state: withOverride, commands: [{ kind: "cancelRecalcDebounce" }] }
      }
      // Bug preservado (FE-1, não corrigido): recalc já em voo → override fica
      // pendente sem reagendar o debounce (o bridge original também só retornava).
      if (state.sync.recalc === "in-flight") {
        return { state: withOverride, commands: [] }
      }
      return {
        state: { ...withOverride, sync: { ...withOverride.sync, recalc: "debouncing" } },
        commands: [{ kind: "armRecalcDebounce" }],
      }
    }

    case "RECALC_DEBOUNCE_FIRED": {
      if (state.status !== "ready") return NO_OP(state)
      if (!state.sync.pendingSync || state.sync.recalc === "in-flight") return NO_OP(state)
      return {
        state: { ...state, sync: { ...state.sync, recalc: "in-flight" } },
        commands: [{ kind: "recalc" }],
      }
    }

    case "RECALC_REQUESTED": {
      if (state.status !== "ready") return NO_OP(state)
      return {
        state: { ...state, sync: { ...state.sync, recalc: "in-flight" } },
        commands: [{ kind: "cancelRecalcDebounce" }, { kind: "recalc" }],
      }
    }

    case "RECALC_SUCCEEDED": {
      if (state.status !== "ready") return NO_OP(state)
      return {
        state: {
          ...state,
          results: { ...state.results, simulation: event.simulation },
          sync: { pendingSync: false, recalc: "idle", lastRecalcError: null },
        },
        commands: [{ kind: "persist", origin: "recalc" }],
      }
    }

    case "RECALC_FAILED": {
      if (state.status !== "ready") return NO_OP(state)
      // Bug preservado (FE-1, não corrigido): pendingSync continua true —
      // sem retry nem transição de erro visível (recalcError original era órfão).
      return {
        state: { ...state, sync: { ...state.sync, recalc: "idle", lastRecalcError: event.error } },
        commands: [],
      }
    }

    case "PERSIST_SUCCEEDED": {
      if (state.status !== "ready") return NO_OP(state)
      const meta = state.results.meta
        ? { ...state.results.meta, recordId: event.recordId }
        : {
            createdAt: new Date().toISOString(),
            companyContext: "",
            year: state.results.simulation.year,
            recordId: event.recordId,
          }
      return { state: { ...state, results: { ...state.results, meta } }, commands: [] }
    }

    case "PERSIST_FAILED": {
      // Bug preservado (FE-1, não corrigido): erro de persistência não tem
      // superfície na UI — só log (ver runtime.ts / steps.ts).
      return NO_OP(state)
    }

    case "DOSSIER_STARTED": {
      if (state.status !== "ready") return NO_OP(state)
      return { state: { ...state, dossierBusy: true }, commands: [] }
    }

    case "DOSSIER_FINISHED": {
      if (state.status !== "ready") return NO_OP(state)
      return { state: { ...state, dossierBusy: false }, commands: [] }
    }

    case "HYDRATED": {
      // Mudança deliberada (FE-1, #3): reseta pendingSync — abrir um registro do
      // histórico não deve herdar o badge de sync de uma sessão anterior.
      return {
        state: {
          status: "ready",
          results: event.results,
          sync: { pendingSync: false, recalc: "idle", lastRecalcError: null },
          dossierBusy: false,
        },
        commands: [{ kind: "cancelRecalcDebounce" }],
      }
    }

    case "RESULTS_CLEARED":
    case "RESET": {
      return { state: { status: "idle", failure: null }, commands: [{ kind: "cancelRecalcDebounce" }] }
    }
  }
}
