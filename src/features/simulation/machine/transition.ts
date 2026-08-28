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
      const first = env.steps[0]
      return {
        state: { status: "running", stepId: first.id, input: event.input, acc: {} },
        commands: [{ kind: "runStep", stepId: first.id, input: event.input, acc: {} }],
      }
    }

    case "STEP_SUCCEEDED": {
      if (state.status !== "running" || state.stepId !== event.stepId) return NO_OP(state)
      const idx = env.steps.findIndex((s) => s.id === event.stepId)
      const next = env.steps[idx + 1]
      if (next) {
        return {
          state: { status: "running", stepId: next.id, input: state.input, acc: event.acc },
          commands: [{ kind: "runStep", stepId: next.id, input: state.input, acc: event.acc }],
        }
      }
      // Último passo do registry: precisa ter produzido `results` — rede de
      // segurança contra um registry mal configurado (ex.: probe fake sem
      // encadear até um passo que devolva resultados).
      if (!event.acc.results) {
        return {
          state: {
            status: "idle",
            failure: {
              step: event.stepId,
              error: new Error("Passo final do pipeline não produziu resultados."),
            },
          },
          commands: [],
        }
      }
      return {
        state: {
          status: "ready",
          results: event.acc.results,
          sync: {
            pendingSync: false,
            recalc: "idle",
            lastRecalcError: null,
            lastPersistError: null,
            lastPersistRetry: null,
          },
          dossierBusy: false,
        },
        commands: [{ kind: "persist", origin: "initial", discoveredTags: event.acc.discoveredTags }],
      }
    }

    case "STEP_FAILED": {
      if (state.status !== "running" || state.stepId !== event.stepId) return NO_OP(state)
      return { state: { status: "idle", failure: { step: event.stepId, error: event.error } }, commands: [] }
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
          sync: { ...state.sync, pendingSync: false, recalc: "idle", lastRecalcError: null },
        },
        commands: [{ kind: "persist", origin: "recalc" }],
      }
    }

    case "RECALC_FAILED": {
      if (state.status !== "ready") return NO_OP(state)
      // Corrigido na Etapa M/PR 8: pendingSync continua true de propósito — é
      // o que mantém "Recalcular impacto" visível como retry — mas agora
      // lastRecalcError chega à UI (use-simulation-pipeline → banner na Mesa)
      // em vez de morrer sem superfície nenhuma.
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
      return {
        state: {
          ...state,
          results: { ...state.results, meta },
          sync: { ...state.sync, lastPersistError: null, lastPersistRetry: null },
        },
        commands: [],
      }
    }

    case "PERSIST_FAILED": {
      // Corrigido na Etapa M/PR 8: antes NO_OP puro — a simulação inteira
      // parecia salva (o veredito já estava na tela) e não tinha sido, sem
      // nenhum sinal ao usuário. Agora fica em lastPersistError, com retry
      // manual via PERSIST_RETRY_REQUESTED — que reemite a MESMA origem
      // (lastPersistRetry), nunca "initial" a esmo: um persist de origem
      // "recalc" que falhe carrega um override de consultor já aplicado, e
      // reemitir como "initial" recalcularia a elegibilidade bruta da IA,
      // descartando esse override em silêncio.
      if (state.status !== "ready") return NO_OP(state)
      return {
        state: {
          ...state,
          sync: {
            ...state.sync,
            lastPersistError: event.error,
            lastPersistRetry: { origin: event.origin, ...event.extra },
          },
        },
        commands: [],
      }
    }

    case "PERSIST_RETRY_REQUESTED": {
      if (state.status !== "ready" || !state.sync.lastPersistRetry) return NO_OP(state)
      const retry = state.sync.lastPersistRetry
      return {
        state: { ...state, sync: { ...state.sync, lastPersistError: null } },
        commands: [{ kind: "persist", ...retry }],
      }
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
          sync: {
            pendingSync: false,
            recalc: "idle",
            lastRecalcError: null,
            lastPersistError: null,
            lastPersistRetry: null,
          },
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
