// Testa o timer de debounce ÚNICO da máquina (FE-1 #4) com tempo falso —
// sem esperar 800ms reais. Os passos de I/O (steps.ts) são mockados: o foco
// aqui é a mecânica do timer (arma/cancela/reagenda), não o conteúdo dos passos
// (isso é responsabilidade de steps.ts, exercitado indiretamente pelo E2E).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import type { SimulationResponse } from "@/types/api"
import type { FormResults, MachineState } from "./machine-types"

vi.mock("./steps", () => ({
  // step-registry.ts importa classifyStep/simulateStep de "./steps" — o mock
  // aqui é visto por todo o grafo do módulo, incluindo o registry.
  classifyStep: { id: "classify", uiStage: "classification", run: vi.fn() },
  simulateStep: { id: "simulate", uiStage: "simulation", run: vi.fn() },
  runRecalc: vi.fn(),
  runPersist: vi.fn(),
}))

const SIMULATION: SimulationResponse = {
  year: 2026,
  current: { gross_tax: "0", credits: "0", net_tax: "0" },
  projected: { gross_tax: "0", credits: "0", net_tax: "0" },
  delta: "0",
  delta_pct: "0",
}

const RESULTS: FormResults = {
  mode: "form",
  simulation: SIMULATION,
  classifications: [],
  expenses: [],
  meta: { createdAt: "2026-01-01T00:00:00.000Z", companyContext: "x", year: 2026 },
}

function readyState(over: Partial<Extract<MachineState, { status: "ready" }>> = {}): MachineState {
  return {
    status: "ready",
    results: RESULTS,
    sync: { pendingSync: false, recalc: "idle", lastRecalcError: null },
    dossierBusy: false,
    ...over,
  }
}

describe("machine-store — timer de debounce único", () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    const { setRuntimeCtx } = await import("./runtime")
    setRuntimeCtx({
      getToken: async () => "token",
      userId: "user-1",
      plan: "pro",
      queryClient: new QueryClient(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it("um único OVERRIDE_APPLIED dispara recalc só após 800ms, nunca antes", async () => {
    const { createSimulationMachineStore } = await import("./machine-store")
    const { runRecalc, runPersist } = await import("./steps")
    vi.mocked(runRecalc).mockResolvedValue({ type: "RECALC_SUCCEEDED", simulation: SIMULATION })
    vi.mocked(runPersist).mockResolvedValue({ type: "PERSIST_SUCCEEDED", recordId: "r1" })

    const machine = createSimulationMachineStore()
    machine.store.setState({ fsm: readyState() })

    machine.dispatch({
      type: "OVERRIDE_APPLIED",
      clientId: "e1",
      override: { is_eligible: false, regime_type: "padrao", overridden_at: "now" },
    })

    await vi.advanceTimersByTimeAsync(799)
    expect(runRecalc).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(runRecalc).toHaveBeenCalledTimes(1)
  })

  it("dois overrides em <800ms cancelam e reagendam — um único runRecalc, não dois", async () => {
    const { createSimulationMachineStore } = await import("./machine-store")
    const { runRecalc, runPersist } = await import("./steps")
    vi.mocked(runRecalc).mockResolvedValue({ type: "RECALC_SUCCEEDED", simulation: SIMULATION })
    vi.mocked(runPersist).mockResolvedValue({ type: "PERSIST_SUCCEEDED", recordId: "r1" })

    const machine = createSimulationMachineStore()
    machine.store.setState({ fsm: readyState() })

    machine.dispatch({
      type: "OVERRIDE_APPLIED",
      clientId: "e1",
      override: { is_eligible: false, regime_type: "padrao", overridden_at: "now" },
    })
    await vi.advanceTimersByTimeAsync(400) // bem antes dos 800ms
    machine.dispatch({
      type: "OVERRIDE_APPLIED",
      clientId: "e1",
      override: { is_eligible: true, regime_type: "diferenciado_60", overridden_at: "now2" },
    })

    // Se o timer NÃO tivesse sido cancelado e reagendado, o primeiro dispararia aqui.
    await vi.advanceTimersByTimeAsync(400)
    expect(runRecalc).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(400)
    expect(runRecalc).toHaveBeenCalledTimes(1)
  })

  it("cancelRecalcTimer evita o disparo por completo", async () => {
    const { createSimulationMachineStore } = await import("./machine-store")
    const { runRecalc } = await import("./steps")

    const machine = createSimulationMachineStore()
    machine.store.setState({ fsm: readyState() })

    machine.dispatch({
      type: "OVERRIDE_APPLIED",
      clientId: "e1",
      override: { is_eligible: false, regime_type: "padrao", overridden_at: "now" },
    })
    machine.cancelRecalcTimer()

    await vi.advanceTimersByTimeAsync(2000)
    expect(runRecalc).not.toHaveBeenCalled()
  })

  it("openDossier com pendingSync cancela o debounce e força o recalc awaited antes do persist", async () => {
    const { createSimulationMachineStore } = await import("./machine-store")
    const { runRecalc, runPersist } = await import("./steps")
    vi.mocked(runRecalc).mockResolvedValue({ type: "RECALC_SUCCEEDED", simulation: SIMULATION })
    vi.mocked(runPersist).mockResolvedValue({ type: "PERSIST_SUCCEEDED", recordId: "r1" })

    const machine = createSimulationMachineStore()
    // pendingSync=true simula um override recém-aplicado ainda não sincronizado.
    machine.store.setState({
      fsm: readyState({ sync: { pendingSync: true, recalc: "debouncing", lastRecalcError: null } }),
    })

    // window.open não existe no ambiente node do vitest — stub mínimo (o
    // teste foca no fluxo de recalc+persist, não na navegação em si).
    vi.stubGlobal("window", { open: vi.fn() })

    const openPromise = machine.openDossier({ reportBrand: null })
    await vi.runAllTimersAsync()
    await openPromise

    expect(runRecalc).toHaveBeenCalledTimes(1)
    // recalc (origin "recalc") + o próprio save do dossiê só rodam se ainda faltar
    // recordId — aqui o recalc já grava um, então persist(dossier) não deveria repetir.
    const finalState = machine.store.getState().fsm
    expect(finalState.status).toBe("ready")
    if (finalState.status === "ready") {
      expect(finalState.results.meta?.recordId).toBe("r1")
      expect(finalState.dossierBusy).toBe(false)
    }
  })
})
