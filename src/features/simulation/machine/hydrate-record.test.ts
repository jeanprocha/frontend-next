// Etapa N/PR 1 — cobre o ponto único de hidratação, extraído por causa de
// dois bugs reais: o histórico global esquecia setCompanyRegime (fato 1) e
// não passava meta.recordId/companyId (fato 2, causava dossiê duplicado).
import { beforeEach, describe, expect, it } from "vitest"
import { useTaxStore } from "@/store/useTaxStore"
import type { SimulationRecordDetailResponse } from "@/types/api"
import { simulationMachine } from "./machine-store"
import { hydrateSimulationFromRecord } from "./hydrate-record"

function minimalDetail(
  overrides: Partial<SimulationRecordDetailResponse>,
): SimulationRecordDetailResponse {
  return {
    id: "rec-1",
    created_at: "2026-01-01T00:00:00Z",
    year: 2027,
    company_context: "Empresa de consultoria tributária",
    company_regime: "simples_hibrido",
    simulation: {
      year: 2027,
      current: { gross_tax: "0", credits: "0", net_tax: "1000" },
      projected: { gross_tax: "0", credits: "0", net_tax: "900" },
      delta: "-100",
      delta_pct: "-10",
    },
    services: [{ id: "s1", description: "Consultoria", amount: "1000.00", iss_rate: "0.05" }],
    expenses: [{ id: "e1", description: "AWS", amount: "500.00" }],
    classifications: [],
    ...overrides,
  }
}

function readyResults() {
  const fsm = simulationMachine.store.getState().fsm
  if (fsm.status !== "ready") throw new Error("esperava status ready após hidratar")
  return fsm.results
}

describe("hydrateSimulationFromRecord", () => {
  beforeEach(() => {
    useTaxStore.setState({
      year: 2026,
      companyContext: "",
      companyRegime: "regular",
      services: [],
      expenses: [],
    })
  })

  it("aplica ano, contexto, regime, serviços e despesas do registo ao store de formulário", () => {
    hydrateSimulationFromRecord(minimalDetail({}))

    const state = useTaxStore.getState()
    expect(state.year).toBe(2027)
    expect(state.companyContext).toBe("Empresa de consultoria tributária")
    expect(state.companyRegime).toBe("simples_hibrido")
    expect(state.services).toEqual([
      { id: "s1", description: "Consultoria", amount: "1000.00", iss_rate: "0.05" },
    ])
    expect(state.expenses).toEqual([{ id: "e1", description: "AWS", amount: "500.00" }])
  })

  it("regime inválido/desconhecido cai no default 'regular' em vez de propagar lixo à UI", () => {
    hydrateSimulationFromRecord(minimalDetail({ company_regime: "regime-inexistente" }))
    expect(useTaxStore.getState().companyRegime).toBe("regular")
  })

  it("hidrata a máquina com meta.recordId — sem isto, 'Gerar Dossiê' cria um registo novo em vez de reaproveitar", () => {
    hydrateSimulationFromRecord(minimalDetail({ id: "rec-42" }))
    expect(readyResults().meta?.recordId).toBe("rec-42")
  })

  it("marca meta.reopenedFromHistory=true — sem isto, o selo 'Simulação do histórico' não sabe distinguir de uma simulação nova (fato 3)", () => {
    hydrateSimulationFromRecord(minimalDetail({}))
    expect(readyResults().meta?.reopenedFromHistory).toBe(true)
  })

  it("companyId do próprio registo tem prioridade sobre o companyId passado por parâmetro", () => {
    hydrateSimulationFromRecord(minimalDetail({ company_id: "empresa-do-registo" }), {
      companyId: "empresa-da-url",
    })
    expect(readyResults().meta?.companyId).toBe("empresa-do-registo")
  })

  it("sem company_id no registo (legado), usa o companyId do parâmetro — caso do workspace", () => {
    hydrateSimulationFromRecord(minimalDetail({ company_id: null }), {
      companyId: "empresa-da-url",
    })
    expect(readyResults().meta?.companyId).toBe("empresa-da-url")
  })

  it("histórico global não passa companyId — registo legado hidrata sem vínculo de cliente", () => {
    hydrateSimulationFromRecord(minimalDetail({ company_id: null }))
    expect(readyResults().meta?.companyId).toBeUndefined()
  })
})
