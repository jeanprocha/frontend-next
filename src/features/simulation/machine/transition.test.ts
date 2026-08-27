import { describe, expect, it } from "vitest"
import type { ClassificationItem, SimulationResponse } from "@/types/api"
import { transition } from "./transition"
import type {
  ClassifiedInput,
  FormResults,
  MachineEnv,
  MachineState,
  PipelineAcc,
  SimulationInput,
  Step,
} from "./machine-types"

/** Passos fake — a transition() só olha `.id`, nunca chama `.run` (isso é o executor). */
function fakeStep(id: string): Step {
  return { id, uiStage: "context", run: async (_input, acc) => ({ ok: true, acc }) }
}
const STEPS: Step[] = [fakeStep("classify"), fakeStep("simulate")]

const ENV_NORMAL: MachineEnv = { presentationMode: false, steps: STEPS }
const ENV_PRESENTATION: MachineEnv = { presentationMode: true, steps: STEPS }

const IDLE: MachineState = { status: "idle", failure: null }

const INPUT: SimulationInput = {
  year: 2026,
  services: [{ id: "s1", description: "Consultoria", amount: "1000.00", iss_rate: "0.05" }],
  expenses: [{ id: "e1", description: "AWS", amount: "500.00" }],
  companyContext: "Empresa SaaS B2B",
  companyRegime: "regular",
}

const CLASSIFICATION: ClassificationItem = {
  client_id: "e1",
  description: "AWS",
  is_eligible: true,
  confidence: 0.9,
  justification: "ok",
  legal_base: "Art. 47",
  risk_level: "baixo",
  regime_type: "padrao",
  evidence: [],
}

const CLASSIFIED: ClassifiedInput = {
  serviceClassifications: [],
  expenseClassifications: [CLASSIFICATION],
  discoveredTags: [],
  aiMetadata: null,
}

const SIMULATION: SimulationResponse = {
  year: 2026,
  current: { gross_tax: "1000.00", credits: "0.00", net_tax: "1000.00" },
  projected: { gross_tax: "900.00", credits: "0.00", net_tax: "900.00" },
  delta: "-100.00",
  delta_pct: "-10.00",
}

const RESULTS: FormResults = {
  mode: "form",
  simulation: SIMULATION,
  classifications: [CLASSIFICATION],
  expenses: INPUT.expenses,
  meta: { createdAt: "2026-01-01T00:00:00.000Z", companyContext: "Empresa SaaS B2B", year: 2026 },
}

function readyState(over: Partial<MachineState & { status: "ready" }> = {}): MachineState {
  return {
    status: "ready",
    results: RESULTS,
    sync: { pendingSync: false, recalc: "idle", lastRecalcError: null },
    dossierBusy: false,
    ...over,
  }
}

describe("transition — fluxo feliz (registry de passos)", () => {
  it("idle + RUN_REQUESTED → running no primeiro passo do registry, dispara [runStep]", () => {
    const { state, commands } = transition(IDLE, { type: "RUN_REQUESTED", input: INPUT }, ENV_NORMAL)
    expect(state).toEqual({ status: "running", stepId: "classify", input: INPUT, acc: {} })
    expect(commands).toEqual([{ kind: "runStep", stepId: "classify", input: INPUT, acc: {} }])
  })

  it("running(classify) + STEP_SUCCEEDED → running(simulate), acc propagado, dispara [runStep]", () => {
    const running: MachineState = { status: "running", stepId: "classify", input: INPUT, acc: {} }
    const acc: PipelineAcc = { classified: CLASSIFIED }
    const { state, commands } = transition(running, { type: "STEP_SUCCEEDED", stepId: "classify", acc }, ENV_NORMAL)
    expect(state).toEqual({ status: "running", stepId: "simulate", input: INPUT, acc })
    expect(commands).toEqual([{ kind: "runStep", stepId: "simulate", input: INPUT, acc }])
  })

  it("running(simulate), último passo, + STEP_SUCCEEDED com acc.results → ready sincronizado, dispara [persist initial]", () => {
    const running: MachineState = {
      status: "running",
      stepId: "simulate",
      input: INPUT,
      acc: { classified: CLASSIFIED },
    }
    const acc: PipelineAcc = { classified: CLASSIFIED, discoveredTags: [], results: RESULTS }
    const { state, commands } = transition(running, { type: "STEP_SUCCEEDED", stepId: "simulate", acc }, ENV_NORMAL)
    expect(state).toEqual({
      status: "ready",
      results: RESULTS,
      sync: { pendingSync: false, recalc: "idle", lastRecalcError: null },
      dossierBusy: false,
    })
    expect(commands).toEqual([{ kind: "persist", origin: "initial", discoveredTags: [] }])
  })
})

describe("transition — genericidade do registry (a máquina não conhece nomes de passo)", () => {
  function fakeStepN(id: string): Step {
    return { id, uiStage: "context", run: async (_input, acc) => ({ ok: true, acc }) }
  }
  const THREE_STEPS: Step[] = [fakeStepN("a"), fakeStepN("b"), fakeStepN("c")]
  const ENV_3: MachineEnv = { presentationMode: false, steps: THREE_STEPS }
  const ENV_1: MachineEnv = { presentationMode: false, steps: [fakeStepN("only")] }

  it("encadeia N passos pela ORDEM do registry, não por nome hardcoded", () => {
    const step1 = transition(IDLE, { type: "RUN_REQUESTED", input: INPUT }, ENV_3)
    expect(step1.state).toEqual({ status: "running", stepId: "a", input: INPUT, acc: {} })

    const step2 = transition(step1.state, { type: "STEP_SUCCEEDED", stepId: "a", acc: {} }, ENV_3)
    expect(step2.state).toEqual({ status: "running", stepId: "b", input: INPUT, acc: {} })

    const step3 = transition(step2.state, { type: "STEP_SUCCEEDED", stepId: "b", acc: {} }, ENV_3)
    expect(step3.state).toEqual({ status: "running", stepId: "c", input: INPUT, acc: {} })

    const final = transition(step3.state, { type: "STEP_SUCCEEDED", stepId: "c", acc: { results: RESULTS } }, ENV_3)
    expect(final.state.status).toBe("ready")
    expect(final.commands).toEqual([{ kind: "persist", origin: "initial", discoveredTags: undefined }])
  })

  it("passo final sem acc.results vira falha de contrato — rede de segurança de um registry mal configurado", () => {
    const running: MachineState = { status: "running", stepId: "only", input: INPUT, acc: {} }
    const { state, commands } = transition(running, { type: "STEP_SUCCEEDED", stepId: "only", acc: {} }, ENV_1)
    expect(state.status).toBe("idle")
    if (state.status !== "idle") throw new Error("unreachable")
    expect(state.failure?.step).toBe("only")
    expect(commands).toEqual([])
  })
})

describe("transition — falha por passo", () => {
  it("running(classify) + STEP_FAILED → idle com failure.step='classify'", () => {
    const running: MachineState = { status: "running", stepId: "classify", input: INPUT, acc: {} }
    const err = new Error("boom")
    const { state, commands } = transition(running, { type: "STEP_FAILED", stepId: "classify", error: err }, ENV_NORMAL)
    expect(state).toEqual({ status: "idle", failure: { step: "classify", error: err } })
    expect(commands).toEqual([])
  })

  it("running(simulate) + STEP_FAILED → idle com failure.step='simulate'", () => {
    const running: MachineState = {
      status: "running",
      stepId: "simulate",
      input: INPUT,
      acc: { classified: CLASSIFIED },
    }
    const err = new Error("boom")
    const { state } = transition(running, { type: "STEP_FAILED", stepId: "simulate", error: err }, ENV_NORMAL)
    expect(state).toEqual({ status: "idle", failure: { step: "simulate", error: err } })
  })

  it("novo RUN_REQUESTED a partir de idle com failure limpa a falha anterior", () => {
    const idleWithFailure: MachineState = { status: "idle", failure: { step: "classify", error: "x" } }
    const { state } = transition(idleWithFailure, { type: "RUN_REQUESTED", input: INPUT }, ENV_NORMAL)
    expect(state).toEqual({ status: "running", stepId: "classify", input: INPUT, acc: {} })
  })
})

describe("transition — override em ready (guardas do bridge original)", () => {
  it("OVERRIDE_APPLIED em modo normal marca pendingSync e arma o debounce", () => {
    const { state, commands } = transition(
      readyState(),
      { type: "OVERRIDE_APPLIED", clientId: "e1", override: { is_eligible: false, regime_type: "padrao", overridden_at: "now" } },
      ENV_NORMAL,
    )
    expect(state.status).toBe("ready")
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.sync.pendingSync).toBe(true)
    expect(state.sync.recalc).toBe("debouncing")
    expect(commands).toEqual([{ kind: "armRecalcDebounce" }])
  })

  it("guarda Board-Ready: presentationMode=true marca pendingSync mas só cancela o timer, não agenda", () => {
    const { state, commands } = transition(
      readyState(),
      { type: "OVERRIDE_APPLIED", clientId: "e1", override: { is_eligible: false, regime_type: "padrao", overridden_at: "now" } },
      ENV_PRESENTATION,
    )
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.sync.pendingSync).toBe(true)
    expect(commands).toEqual([{ kind: "cancelRecalcDebounce" }])
  })

  it("bug preservado (FE-1): override chegado com recalc já em voo não reagenda o debounce", () => {
    const inFlight = readyState({ sync: { pendingSync: false, recalc: "in-flight", lastRecalcError: null } })
    const { state, commands } = transition(
      inFlight,
      { type: "OVERRIDE_APPLIED", clientId: "e1", override: { is_eligible: false, regime_type: "padrao", overridden_at: "now" } },
      ENV_NORMAL,
    )
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.sync.pendingSync).toBe(true)
    expect(state.sync.recalc).toBe("in-flight") // permanece — não volta a debouncing
    expect(commands).toEqual([])
  })

  it("OVERRIDES_CLEARED sem overrides existentes é no-op por referência (preserva if(!hasAny) do store)", () => {
    const base = readyState()
    const { state, commands } = transition(base, { type: "OVERRIDES_CLEARED" }, ENV_NORMAL)
    expect(state).toBe(base) // mesma referência
    expect(commands).toEqual([])
  })
})

describe("transition — debounce e recálculo", () => {
  const pendingReady = readyState({ sync: { pendingSync: true, recalc: "debouncing", lastRecalcError: null } })

  it("RECALC_DEBOUNCE_FIRED com pendingSync=true dispara [recalc] e marca in-flight", () => {
    const { state, commands } = transition(pendingReady, { type: "RECALC_DEBOUNCE_FIRED" }, ENV_NORMAL)
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.sync.recalc).toBe("in-flight")
    expect(commands).toEqual([{ kind: "recalc" }])
  })

  it("RECALC_DEBOUNCE_FIRED sem pendingSync é no-op", () => {
    const synced = readyState()
    const { state, commands } = transition(synced, { type: "RECALC_DEBOUNCE_FIRED" }, ENV_NORMAL)
    expect(state).toBe(synced)
    expect(commands).toEqual([])
  })

  it("RECALC_REQUESTED (CTA manual) cancela o debounce e dispara recalc imediatamente", () => {
    const { state, commands } = transition(pendingReady, { type: "RECALC_REQUESTED" }, ENV_NORMAL)
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.sync.recalc).toBe("in-flight")
    expect(commands).toEqual([{ kind: "cancelRecalcDebounce" }, { kind: "recalc" }])
  })

  it("RECALC_SUCCEEDED substitui a simulação, limpa pendingSync e dispara [persist recalc]", () => {
    const inFlight = readyState({ sync: { pendingSync: true, recalc: "in-flight", lastRecalcError: null } })
    const newSim: SimulationResponse = { ...SIMULATION, delta: "-500.00" }
    const { state, commands } = transition(inFlight, { type: "RECALC_SUCCEEDED", simulation: newSim }, ENV_NORMAL)
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.results.simulation.delta).toBe("-500.00")
    expect(state.sync).toEqual({ pendingSync: false, recalc: "idle", lastRecalcError: null })
    expect(commands).toEqual([{ kind: "persist", origin: "recalc" }])
  })

  it("bug preservado (FE-1): RECALC_FAILED mantém pendingSync=true para sempre (sem retry)", () => {
    const inFlight = readyState({ sync: { pendingSync: true, recalc: "in-flight", lastRecalcError: null } })
    const err = new Error("falhou")
    const { state, commands } = transition(inFlight, { type: "RECALC_FAILED", error: err }, ENV_NORMAL)
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.sync.pendingSync).toBe(true)
    expect(state.sync.recalc).toBe("idle")
    expect(state.sync.lastRecalcError).toBe(err)
    expect(commands).toEqual([])
  })
})

describe("transition — persist", () => {
  it("PERSIST_SUCCEEDED grava recordId em meta existente", () => {
    const { state } = transition(readyState(), { type: "PERSIST_SUCCEEDED", recordId: "rec-1" }, ENV_NORMAL)
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.results.meta?.recordId).toBe("rec-1")
  })

  it("PERSIST_FAILED não muda o estado (erro sem superfície de UI — bug preservado)", () => {
    const base = readyState()
    const { state, commands } = transition(base, { type: "PERSIST_FAILED", error: new Error("x") }, ENV_NORMAL)
    expect(state).toBe(base)
    expect(commands).toEqual([])
  })
})

describe("transition — dossiê", () => {
  it("DOSSIER_STARTED/FINISHED alternam dossierBusy", () => {
    const started = transition(readyState(), { type: "DOSSIER_STARTED" }, ENV_NORMAL).state
    if (started.status !== "ready") throw new Error("unreachable")
    expect(started.dossierBusy).toBe(true)

    const finished = transition(started, { type: "DOSSIER_FINISHED" }, ENV_NORMAL).state
    if (finished.status !== "ready") throw new Error("unreachable")
    expect(finished.dossierBusy).toBe(false)
  })
})

describe("transition — hidratação do histórico", () => {
  it("HYDRATED a partir de idle vai direto para ready com sync resetado", () => {
    const { state, commands } = transition(IDLE, { type: "HYDRATED", results: RESULTS }, ENV_NORMAL)
    expect(state).toEqual({
      status: "ready",
      results: RESULTS,
      sync: { pendingSync: false, recalc: "idle", lastRecalcError: null },
      dossierBusy: false,
    })
    expect(commands).toEqual([{ kind: "cancelRecalcDebounce" }])
  })

  it("mudança deliberada (FE-1 #3): HYDRATED a partir de ready com pendingSync=true reseta o sync", () => {
    const dirty = readyState({ sync: { pendingSync: true, recalc: "debouncing", lastRecalcError: "x" } })
    const other: FormResults = { ...RESULTS, meta: { ...RESULTS.meta!, recordId: "outro" } }
    const { state } = transition(dirty, { type: "HYDRATED", results: other }, ENV_NORMAL)
    if (state.status !== "ready") throw new Error("unreachable")
    expect(state.sync).toEqual({ pendingSync: false, recalc: "idle", lastRecalcError: null })
    expect(state.results.meta?.recordId).toBe("outro")
  })
})

describe("transition — reset / clear", () => {
  it("RESULTS_CLEARED volta para idle e cancela o debounce", () => {
    const { state, commands } = transition(readyState(), { type: "RESULTS_CLEARED" }, ENV_NORMAL)
    expect(state).toEqual({ status: "idle", failure: null })
    expect(commands).toEqual([{ kind: "cancelRecalcDebounce" }])
  })

  it("RESET a partir de qualquer estado volta para idle limpo", () => {
    const { state } = transition({ status: "running", stepId: "classify", input: INPUT, acc: {} }, { type: "RESET" }, ENV_NORMAL)
    expect(state).toEqual({ status: "idle", failure: null })
  })
})

describe("transition — eventos impossíveis (no-op por referência)", () => {
  it("RUN_REQUESTED enquanto já running não reinicia o pipeline", () => {
    const running: MachineState = { status: "running", stepId: "classify", input: INPUT, acc: {} }
    const { state, commands } = transition(running, { type: "RUN_REQUESTED", input: INPUT }, ENV_NORMAL)
    expect(state).toBe(running)
    expect(commands).toEqual([])
  })

  it("STEP_SUCCEEDED fora de running é no-op", () => {
    const { state, commands } = transition(IDLE, { type: "STEP_SUCCEEDED", stepId: "classify", acc: {} }, ENV_NORMAL)
    expect(state).toBe(IDLE)
    expect(commands).toEqual([])
  })

  it("STEP_SUCCEEDED com stepId diferente do passo em execução é no-op (evento tardio, ex.: pós-RESET)", () => {
    const running: MachineState = { status: "running", stepId: "simulate", input: INPUT, acc: {} }
    const { state, commands } = transition(running, { type: "STEP_SUCCEEDED", stepId: "classify", acc: {} }, ENV_NORMAL)
    expect(state).toBe(running)
    expect(commands).toEqual([])
  })

  it("OVERRIDE_APPLIED fora de ready é no-op", () => {
    const { state, commands } = transition(
      IDLE,
      { type: "OVERRIDE_APPLIED", clientId: "e1", override: { is_eligible: true, regime_type: "padrao", overridden_at: "now" } },
      ENV_NORMAL,
    )
    expect(state).toBe(IDLE)
    expect(commands).toEqual([])
  })
})
