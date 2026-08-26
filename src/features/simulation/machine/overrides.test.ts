import { describe, expect, it } from "vitest"
import type { ClassificationItem, ConsultantClassificationOverride } from "@/types/api"
import { applyOverride, clearAllOverrides, removeOverride } from "./overrides"
import type { FormResults } from "./machine-types"

const OVERRIDE: ConsultantClassificationOverride = {
  is_eligible: false,
  regime_type: "padrao",
  overridden_at: "2026-01-01T00:00:00.000Z",
}

function baseResults(classifications: ClassificationItem[]): FormResults {
  return {
    mode: "form",
    simulation: {
      year: 2026,
      current: { gross_tax: "0", credits: "0", net_tax: "0" },
      projected: { gross_tax: "0", credits: "0", net_tax: "0" },
      delta: "0",
      delta_pct: "0",
    },
    classifications,
    expenses: [],
  }
}

describe("applyOverride", () => {
  it("faz match por client_id e aplica só na linha correspondente", () => {
    const a: ClassificationItem = { client_id: "e1", description: "AWS", is_eligible: true, confidence: 0.9, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [] }
    const b: ClassificationItem = { client_id: "e2", description: "GitHub", is_eligible: true, confidence: 0.9, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [] }
    const results = baseResults([a, b])

    const next = applyOverride(results, "e1", OVERRIDE)

    expect(next.classifications[0].consultant_override).toEqual(OVERRIDE)
    expect(next.classifications[1].consultant_override).toBeUndefined()
    expect(next.classifications[1]).toBe(b) // linha não afetada preserva referência
  })

  it("fallback por description quando client_id está ausente", () => {
    const a: ClassificationItem = { description: "AWS", is_eligible: true, confidence: 0.9, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [] }
    const results = baseResults([a])

    const next = applyOverride(results, "AWS", OVERRIDE)

    expect(next.classifications[0].consultant_override).toEqual(OVERRIDE)
  })

  it("NUNCA sobrescreve is_eligible/regime_type originais da IA — só adiciona consultant_override", () => {
    const a: ClassificationItem = { client_id: "e1", description: "AWS", is_eligible: true, confidence: 0.9, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [] }
    const next = applyOverride(baseResults([a]), "e1", OVERRIDE)

    expect(next.classifications[0].is_eligible).toBe(true) // sugestão original da IA intacta
    expect(next.classifications[0].regime_type).toBe("padrao")
  })

  it("results e classifications são sempre novas referências (imutabilidade)", () => {
    const results = baseResults([{ client_id: "e1", description: "AWS", is_eligible: true, confidence: 0.9, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [] }])
    const next = applyOverride(results, "e1", OVERRIDE)
    expect(next).not.toBe(results)
    expect(next.classifications).not.toBe(results.classifications)
  })
})

describe("removeOverride", () => {
  it("restaura a sugestão da IA removendo consultant_override", () => {
    const overridden: ClassificationItem = {
      client_id: "e1",
      description: "AWS",
      is_eligible: true,
      confidence: 0.9,
      justification: "",
      legal_base: "",
      risk_level: "baixo",
      regime_type: "padrao",
      evidence: [],
      consultant_override: OVERRIDE,
    }
    const next = removeOverride(baseResults([overridden]), "e1")
    expect(next.classifications[0].consultant_override).toBeUndefined()
    expect(next.classifications[0].is_eligible).toBe(true)
  })

  it("linha sem match preserva referência", () => {
    const a: ClassificationItem = { client_id: "e1", description: "AWS", is_eligible: true, confidence: 0.9, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [] }
    const results = baseResults([a])
    const next = removeOverride(results, "e2")
    expect(next.classifications[0]).toBe(a)
  })
})

describe("clearAllOverrides", () => {
  it("sem overrides existentes retorna a MESMA referência (no-op)", () => {
    const a: ClassificationItem = { client_id: "e1", description: "AWS", is_eligible: true, confidence: 0.9, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [] }
    const results = baseResults([a])
    expect(clearAllOverrides(results)).toBe(results)
  })

  it("remove todos os overrides existentes de uma vez", () => {
    const a: ClassificationItem = { client_id: "e1", description: "AWS", is_eligible: true, confidence: 0.9, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [], consultant_override: OVERRIDE }
    const b: ClassificationItem = { client_id: "e2", description: "GitHub", is_eligible: false, confidence: 0.8, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao", evidence: [], consultant_override: OVERRIDE }
    const next = clearAllOverrides(baseResults([a, b]))
    expect(next.classifications.every((c) => c.consultant_override === undefined)).toBe(true)
  })
})
