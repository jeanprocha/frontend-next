import { describe, expect, it } from "vitest"
import type { ClassificationItem, FormExpense, FormService, SimulationResponse } from "@/types/api"
import type { PersistedResults } from "@/lib/persisted-results"
import { buildSimulationRecordCreatePayload } from "./build-record-payload"

const SIMULATION: SimulationResponse = {
  year: 2026,
  current: { gross_tax: "1000.00", credits: "0.00", net_tax: "1000.00" },
  projected: { gross_tax: "900.00", credits: "0.00", net_tax: "900.00" },
  delta: "-100.00",
  delta_pct: "-10.00",
}

const EXPENSE: FormExpense = { id: "e1", description: "AWS", amount: "500.00" }
const SERVICE: FormService = { id: "s1", description: "Consultoria", amount: "1000.00", iss_rate: "0.05" }

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

function formResults(meta?: PersistedResults["meta"]): Extract<PersistedResults, { mode: "form" }> {
  return {
    mode: "form",
    simulation: SIMULATION,
    classifications: [CLASSIFICATION],
    expenses: [EXPENSE],
    meta,
  }
}

function baseInput(meta?: PersistedResults["meta"]) {
  return {
    year: 2026,
    companyContext: "Empresa SaaS B2B",
    companyRegime: "regular" as const,
    services: [SERVICE],
    expenses: [EXPENSE],
    formResults: formResults(meta),
  }
}

describe("buildSimulationRecordCreatePayload — company_id (FE-4)", () => {
  it("emite company_id quando o meta traz companyId (workspace do cliente)", () => {
    const payload = buildSimulationRecordCreatePayload(baseInput({
      createdAt: "2026-01-01T00:00:00.000Z",
      companyContext: "Empresa SaaS B2B",
      year: 2026,
      companyId: "22222222-2222-4222-8222-222222222222",
    }))
    expect(payload.company_id).toBe("22222222-2222-4222-8222-222222222222")
  })

  it("não emite company_id quando o meta não traz companyId (simulador avulso)", () => {
    const payload = buildSimulationRecordCreatePayload(baseInput({
      createdAt: "2026-01-01T00:00:00.000Z",
      companyContext: "Empresa SaaS B2B",
      year: 2026,
    }))
    expect(payload.company_id).toBeUndefined()
  })

  it("não emite company_id quando não há meta algum", () => {
    const payload = buildSimulationRecordCreatePayload(baseInput(undefined))
    expect(payload.company_id).toBeUndefined()
  })

  it("nunca emite organization_id (campo legado removido do contrato)", () => {
    const payload = buildSimulationRecordCreatePayload(baseInput({
      createdAt: "2026-01-01T00:00:00.000Z",
      companyContext: "Empresa SaaS B2B",
      year: 2026,
      companyId: "22222222-2222-4222-8222-222222222222",
    }))
    expect(payload).not.toHaveProperty("organization_id")
  })
})
