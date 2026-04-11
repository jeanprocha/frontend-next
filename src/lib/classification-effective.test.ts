import { describe, expect, it } from "vitest"
import {
  EXPENSE_OVERRIDE_OPTIONS,
  findOverrideOption,
  getAiSuggestedLabel,
  getEffectiveExpenseSimulationFields,
  getEffectiveLabel,
  getEffectiveOption,
  hasConsultantOverride,
} from "./classification-effective"
import type { ClassificationItem } from "@/types/api"

function makeClassification(
  is_eligible: boolean,
  regime_type: string,
  overrideEligible?: boolean,
  overrideRegime?: string,
): ClassificationItem {
  return {
    description: "Test expense",
    is_eligible,
    regime_type,
    confidence: 0.8,
    justification: "",
    legal_base: "",
    risk_level: "baixo",
    evidence: [],
    consultant_override:
      overrideEligible !== undefined
        ? {
            is_eligible: overrideEligible,
            regime_type: overrideRegime ?? "padrao",
            overridden_at: "2026-01-01T00:00:00Z",
          }
        : undefined,
  }
}

describe("EXPENSE_OVERRIDE_OPTIONS", () => {
  it("está pré-ordenada alfabeticamente por label", () => {
    const labels = EXPENSE_OVERRIDE_OPTIONS.map((o) => o.label)
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, "pt-BR"))
    expect(labels).toEqual(sorted)
  })

  it("cobre is_eligible true e false", () => {
    const hasEligible = EXPENSE_OVERRIDE_OPTIONS.some((o) => o.is_eligible)
    const hasIneligible = EXPENSE_OVERRIDE_OPTIONS.some((o) => !o.is_eligible)
    expect(hasEligible).toBe(true)
    expect(hasIneligible).toBe(true)
  })

  it("todas as valueKey são únicas", () => {
    const keys = EXPENSE_OVERRIDE_OPTIONS.map((o) => o.valueKey)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe("getEffectiveExpenseSimulationFields", () => {
  it("usa sugestão IA quando sem override", () => {
    const c = makeClassification(true, "diferenciado_60")
    expect(getEffectiveExpenseSimulationFields(c)).toEqual({
      is_eligible: true,
      regime_type: "diferenciado_60",
    })
  })

  it("usa override do consultor quando presente", () => {
    const c = makeClassification(true, "padrao", false, "padrao")
    expect(getEffectiveExpenseSimulationFields(c)).toEqual({
      is_eligible: false,
      regime_type: "padrao",
    })
  })

  it("fallback seguro para null", () => {
    expect(getEffectiveExpenseSimulationFields(null)).toEqual({
      is_eligible: false,
      regime_type: "padrao",
    })
  })

  it("normaliza regime_type vazio para padrao", () => {
    const c = makeClassification(true, "padrao", true, "")
    expect(getEffectiveExpenseSimulationFields(c).regime_type).toBe("padrao")
  })
})

describe("hasConsultantOverride", () => {
  it("retorna false sem override", () => {
    expect(hasConsultantOverride(makeClassification(true, "padrao"))).toBe(false)
  })

  it("retorna true com override", () => {
    expect(hasConsultantOverride(makeClassification(true, "padrao", false))).toBe(true)
  })

  it("retorna false para null", () => {
    expect(hasConsultantOverride(null)).toBe(false)
  })
})

describe("getAiSuggestedLabel / getEffectiveLabel", () => {
  it("rótulo IA independente de override", () => {
    const c = makeClassification(true, "padrao", false, "padrao")
    expect(getAiSuggestedLabel(c)).toBe("Elegível · Padrão")
  })

  it("rótulo efectivo reflecte override", () => {
    const c = makeClassification(true, "padrao", false, "padrao")
    expect(getEffectiveLabel(c)).toBe("Não elegível a crédito")
  })

  it("rótulo efectivo = IA quando sem override", () => {
    const c = makeClassification(true, "reduzido_zero")
    expect(getEffectiveLabel(c)).toBe("Elegível · Alíquota Zero")
  })
})

describe("findOverrideOption", () => {
  it("encontra opção exacta", () => {
    const opt = findOverrideOption(true, "diferenciado_60")
    expect(opt.valueKey).toBe("eligible_diferenciado_60")
  })

  it("fallback para padrao elegível em par desconhecido", () => {
    const opt = findOverrideOption(true, "unknown_regime")
    expect(opt.valueKey).toBe("eligible_padrao")
  })
})

describe("getEffectiveOption", () => {
  it("devolve a opção IA quando sem override", () => {
    const c = makeClassification(true, "padrao")
    expect(getEffectiveOption(c).valueKey).toBe("eligible_padrao")
  })

  it("devolve a opção do consultor quando com override", () => {
    const c = makeClassification(true, "padrao", false, "padrao")
    expect(getEffectiveOption(c).valueKey).toBe("ineligible")
  })
})
