import { describe, expect, it } from "vitest"
import { simulationDetailToPersisted } from "./history-hydrate"
import type { SimulationRecordDetailResponse } from "@/types/api"

function minimalDetail(
  overrides: Partial<SimulationRecordDetailResponse>,
): SimulationRecordDetailResponse {
  return {
    id: "id-1",
    created_at: "2026-01-01T00:00:00Z",
    year: 2026,
    company_context: "ctx",
    simulation: {
      year: 2026,
      current: { gross_tax: "0", credits: "0", net_tax: "100" },
      projected: { gross_tax: "0", credits: "0", net_tax: "90" },
      delta: "-10",
      delta_pct: "-10",
    },
    services: [],
    expenses: [{ id: "e1", description: "Papel", amount: "100" }],
    classifications: [
      {
        description: "Papel",
        is_eligible: true,
        confidence: 0.5,
        justification: "",
        legal_base: "",
        risk_level: "baixo",
        regime_type: "padrao",
        evidence: [],
      },
    ],
    ...overrides,
  }
}

describe("simulationDetailToPersisted", () => {
  it("usa ai_metadata e despesas do classifications_snapshot quando presente", () => {
    const d = minimalDetail({
      classifications_snapshot: {
        snapshot_version: 1,
        expense_classifications: [
          {
            description: "Papel",
            is_eligible: true,
            confidence: 0.9,
            justification: "j",
            legal_base: "lb",
            risk_level: "baixo",
            regime_type: "padrao",
            evidence: [{ article_id: "a1", content: "trecho", similarity: 0.8 }],
          },
        ],
        service_classifications: [],
        ai_metadata: {
          confidence_score: 0.85,
          sources_analyzed: ["LC 68"],
        },
      },
    })
    const p = simulationDetailToPersisted(d, {
      createdAt: d.created_at,
      companyContext: d.company_context,
      year: d.year,
    })
    expect(p.ai_metadata?.confidence_score).toBe(0.85)
    expect(p.ai_metadata?.sources_analyzed).toEqual(["LC 68"])
    expect(p.classifications[0]?.evidence?.[0]?.article_id).toBe("a1")
  })

  it("sem snapshot, recompõe ai_metadata a partir das classificações do GET", () => {
    const d = minimalDetail({ classifications_snapshot: undefined })
    const p = simulationDetailToPersisted(d, {
      createdAt: d.created_at,
      companyContext: d.company_context,
      year: d.year,
    })
    expect(p.classifications).toHaveLength(1)
    expect(p.ai_metadata).not.toBeNull()
  })

  it("preenche service_classifications a partir do snapshot quando presente", () => {
    const d = minimalDetail({
      classifications_snapshot: {
        snapshot_version: 1,
        service_classifications: [
          {
            description: "Serviço SaaS",
            is_eligible: true,
            confidence: 0.9,
            justification: "j",
            legal_base: "Art. 5",
            risk_level: "baixo",
            regime_type: "padrao",
            evidence: [],
          },
        ],
      },
    })
    const p = simulationDetailToPersisted(d, {
      createdAt: d.created_at,
      companyContext: d.company_context,
      year: d.year,
    })
    expect(p.service_classifications).toHaveLength(1)
    expect(p.service_classifications![0].description).toBe("Serviço SaaS")
  })

  it("service_classifications é undefined quando snapshot não tem serviços", () => {
    const d = minimalDetail({ classifications_snapshot: undefined })
    const p = simulationDetailToPersisted(d, {
      createdAt: d.created_at,
      companyContext: d.company_context,
      year: d.year,
    })
    expect(p.service_classifications).toBeUndefined()
  })
})
