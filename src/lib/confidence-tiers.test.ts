import { describe, expect, it } from "vitest"

import {
  CONFIDENCE_TIER_GREEN_MIN,
  CONFIDENCE_TIER_YELLOW_MIN,
  confidenceTierFromScore01,
  parseConfidenceScore01,
} from "./confidence-tiers"

// ─── parseConfidenceScore01 ───────────────────────────────────────────────────

describe("parseConfidenceScore01", () => {
  describe("número finito", () => {
    it("retorna o valor clampado quando dentro de [0,1]", () => {
      expect(parseConfidenceScore01(0.87)).toBe(0.87)
      expect(parseConfidenceScore01(0)).toBe(0)
      expect(parseConfidenceScore01(1)).toBe(1)
    })

    it("clamp para 1 quando acima de 1", () => {
      expect(parseConfidenceScore01(1.5)).toBe(1)
    })

    it("clamp para 0 quando negativo", () => {
      expect(parseConfidenceScore01(-0.1)).toBe(0)
    })

    it("retorna null para NaN", () => {
      expect(parseConfidenceScore01(NaN)).toBeNull()
    })

    it("retorna null para Infinity", () => {
      expect(parseConfidenceScore01(Infinity)).toBeNull()
      expect(parseConfidenceScore01(-Infinity)).toBeNull()
    })
  })

  describe("string com ponto", () => {
    it("parseia string decimal válida", () => {
      expect(parseConfidenceScore01("0.72")).toBe(0.72)
      expect(parseConfidenceScore01("0.92")).toBe(0.92)
    })

    it("trim de espaços", () => {
      expect(parseConfidenceScore01("  0.45  ")).toBe(0.45)
    })

    it("string '1' e '0'", () => {
      expect(parseConfidenceScore01("1")).toBe(1)
      expect(parseConfidenceScore01("0")).toBe(0)
    })

    it("clamp string acima de 1", () => {
      expect(parseConfidenceScore01("1.2")).toBe(1)
    })
  })

  describe("string com vírgula (formato BR)", () => {
    it("normaliza vírgula para ponto", () => {
      expect(parseConfidenceScore01("0,87")).toBe(0.87)
      expect(parseConfidenceScore01("0,60")).toBe(0.6)
    })
  })

  describe("entradas inválidas", () => {
    it("string vazia retorna null", () => {
      expect(parseConfidenceScore01("")).toBeNull()
      expect(parseConfidenceScore01("   ")).toBeNull()
    })

    it("texto não numérico retorna null", () => {
      expect(parseConfidenceScore01("abc")).toBeNull()
      expect(parseConfidenceScore01("verde")).toBeNull()
    })

    it("null e undefined retornam null", () => {
      expect(parseConfidenceScore01(null)).toBeNull()
      expect(parseConfidenceScore01(undefined)).toBeNull()
    })

    it("object e array retornam null", () => {
      expect(parseConfidenceScore01({})).toBeNull()
      expect(parseConfidenceScore01([])).toBeNull()
    })
  })
})

// ─── Limites do semáforo via confidenceTierFromScore01 ───────────────────────

describe("confidenceTierFromScore01 — cobertura dos limites do semáforo", () => {
  it("verde estrito: acima de CONFIDENCE_TIER_GREEN_MIN", () => {
    expect(confidenceTierFromScore01(CONFIDENCE_TIER_GREEN_MIN + 0.01)).toBe("green")
    expect(confidenceTierFromScore01(0.92)).toBe("green")
    expect(confidenceTierFromScore01(1)).toBe("green")
  })

  it("âmbar: exactamente CONFIDENCE_TIER_GREEN_MIN cai em âmbar", () => {
    expect(confidenceTierFromScore01(CONFIDENCE_TIER_GREEN_MIN)).toBe("yellow")
    expect(confidenceTierFromScore01(0.85)).toBe("yellow")
  })

  it("âmbar: exactamente CONFIDENCE_TIER_YELLOW_MIN cai em âmbar", () => {
    expect(confidenceTierFromScore01(CONFIDENCE_TIER_YELLOW_MIN)).toBe("yellow")
    expect(confidenceTierFromScore01(0.6)).toBe("yellow")
  })

  it("âmbar: valores intermédios", () => {
    expect(confidenceTierFromScore01(0.72)).toBe("yellow")
  })

  it("vermelho: abaixo de CONFIDENCE_TIER_YELLOW_MIN", () => {
    expect(confidenceTierFromScore01(CONFIDENCE_TIER_YELLOW_MIN - 0.01)).toBe("red")
    expect(confidenceTierFromScore01(0.45)).toBe("red")
    expect(confidenceTierFromScore01(0)).toBe("red")
  })
})
