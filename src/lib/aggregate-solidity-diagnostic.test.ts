import { describe, expect, it } from "vitest"

import {
  CONFIDENCE_TIER_GREEN_MIN,
  CONFIDENCE_TIER_YELLOW_MIN,
} from "./confidence-tiers"
import {
  buildAggregateSolidityDiagnosticMessage,
  resolveAdherencePercentForDiagnostic,
  resolveReviewPercentForDiagnostic,
} from "./aggregate-solidity-diagnostic"

// ─── resolveReviewPercentForDiagnostic ───────────────────────────────────────

describe("resolveReviewPercentForDiagnostic", () => {
  it("usa evidence_coverage quando disponível: review = 1 - coverage", () => {
    expect(resolveReviewPercentForDiagnostic(0.72, 0.65)).toBe(35) // round((1-0.65)*100)
    expect(resolveReviewPercentForDiagnostic(0.72, 0.8)).toBe(20)
    expect(resolveReviewPercentForDiagnostic(0.45, 0.3)).toBe(70)
  })

  it("fallback em (1 - score) quando coverage indisponível", () => {
    expect(resolveReviewPercentForDiagnostic(0.72, null)).toBe(28)
    expect(resolveReviewPercentForDiagnostic(0.45, undefined)).toBe(55)
  })

  it("clamp: coverage = 0 → review 100%; coverage = 1 → review 0%", () => {
    expect(resolveReviewPercentForDiagnostic(0.5, 0)).toBe(100)
    expect(resolveReviewPercentForDiagnostic(0.5, 1)).toBe(0)
  })

  it("clamp fallback: score = 1 → review 0%; score = 0 → review 100%", () => {
    expect(resolveReviewPercentForDiagnostic(1, null)).toBe(0)
    expect(resolveReviewPercentForDiagnostic(0, null)).toBe(100)
  })
})

// ─── resolveAdherencePercentForDiagnostic ────────────────────────────────────

describe("resolveAdherencePercentForDiagnostic", () => {
  it("usa evidence_coverage directamente quando disponível", () => {
    expect(resolveAdherencePercentForDiagnostic(0.9, 0.85)).toBe(85)
    expect(resolveAdherencePercentForDiagnostic(0.9, 1)).toBe(100)
  })

  it("fallback em score quando coverage indisponível", () => {
    expect(resolveAdherencePercentForDiagnostic(0.92, null)).toBe(92)
    expect(resolveAdherencePercentForDiagnostic(0.87, undefined)).toBe(87)
  })
})

// ─── buildAggregateSolidityDiagnosticMessage ─────────────────────────────────

describe("buildAggregateSolidityDiagnosticMessage — tier verde", () => {
  const greenScore = CONFIDENCE_TIER_GREEN_MIN + 0.01 // 0.86

  it("Pro: percentagem de aderência é sempre a do score (mesma da barra), mesmo com evidence_coverage diferente", () => {
    // evidenceCoverage01 (0.9) diverge deliberadamente do score (0.86) — a
    // frase não pode citar 90% enquanto a barra de solidez mostra 86%
    // (achado do critique: "duas verdades na mesma dobra").
    const r = buildAggregateSolidityDiagnosticMessage({
      score: greenScore,
      evidenceCoverage01: 0.9,
      isPro: true,
    })
    expect(r.tier).toBe("green")
    expect(r.adherencePct).toBe(86)
    expect(r.reviewPct).toBeNull()
    expect(r.message).toContain("86%")
    expect(r.message).not.toContain("90%")
    expect(r.message).toContain("lei recuperada")
  })

  it("Pro sem evidence_coverage: fallback % em score", () => {
    const r = buildAggregateSolidityDiagnosticMessage({
      score: 0.92,
      evidenceCoverage01: null,
      isPro: true,
    })
    expect(r.adherencePct).toBe(92)
    expect(r.message).toContain("92%")
  })

  it("Free: mensagem sem percentagem", () => {
    const r = buildAggregateSolidityDiagnosticMessage({
      score: greenScore,
      evidenceCoverage01: 0.9,
      isPro: false,
    })
    expect(r.adherencePct).toBeNull()
    expect(r.reviewPct).toBeNull()
    expect(r.message).not.toMatch(/\d+%/)
    expect(r.message.toLowerCase()).toContain("admissibilidade")
  })
})

describe("buildAggregateSolidityDiagnosticMessage — tier âmbar", () => {
  const amberScore = CONFIDENCE_TIER_YELLOW_MIN + 0.1 // 0.70

  it("Pro: percentagem de revisão é sempre o complemento do score (mesmo com evidence_coverage diferente)", () => {
    // evidenceCoverage01 (0.65) divergiria para 35% pela lógica antiga —
    // a frase agora usa 100 − score (30%), coerente com a barra de solidez.
    const r = buildAggregateSolidityDiagnosticMessage({
      score: amberScore,
      evidenceCoverage01: 0.65,
      isPro: true,
    })
    expect(r.tier).toBe("yellow")
    expect(r.reviewPct).toBe(30)
    expect(r.adherencePct).toBeNull()
    expect(r.message).toContain("30%")
    expect(r.message).not.toContain("35%")
    expect(r.message.toLowerCase()).toContain("revisão")
  })

  it("Pro sem evidence_coverage: fallback Y% via score", () => {
    const r = buildAggregateSolidityDiagnosticMessage({
      score: 0.72,
      evidenceCoverage01: null,
      isPro: true,
    })
    expect(r.reviewPct).toBe(28)
    expect(r.message).toContain("28%")
  })

  it("Free: mensagem sem percentagem, mas com aviso de revisão", () => {
    const r = buildAggregateSolidityDiagnosticMessage({
      score: amberScore,
      evidenceCoverage01: 0.65,
      isPro: false,
    })
    expect(r.reviewPct).toBeNull()
    expect(r.message).not.toMatch(/\d+%/)
    expect(r.message.toLowerCase()).toContain("revisão")
  })

  it("limite exacto CONFIDENCE_TIER_GREEN_MIN cai em âmbar", () => {
    const r = buildAggregateSolidityDiagnosticMessage({
      score: CONFIDENCE_TIER_GREEN_MIN,
      evidenceCoverage01: null,
      isPro: false,
    })
    expect(r.tier).toBe("yellow")
  })

  it("limite exacto CONFIDENCE_TIER_YELLOW_MIN cai em âmbar", () => {
    const r = buildAggregateSolidityDiagnosticMessage({
      score: CONFIDENCE_TIER_YELLOW_MIN,
      evidenceCoverage01: null,
      isPro: false,
    })
    expect(r.tier).toBe("yellow")
  })
})

describe("buildAggregateSolidityDiagnosticMessage — tier vermelho", () => {
  const redScore = CONFIDENCE_TIER_YELLOW_MIN - 0.01 // 0.59

  it("Pro: percentagem de revisão é sempre o complemento do score, com risco de enquadramento", () => {
    // evidenceCoverage01 (0.3) divergiria para 70% pela lógica antiga —
    // a frase agora usa 100 − score (41%), coerente com a barra de solidez.
    const r = buildAggregateSolidityDiagnosticMessage({
      score: redScore,
      evidenceCoverage01: 0.3,
      isPro: true,
    })
    expect(r.tier).toBe("red")
    expect(r.reviewPct).toBe(41)
    expect(r.message).toContain("41%")
    expect(r.message).not.toContain("70%")
    expect(r.message.toLowerCase()).toContain("risco")
    expect(r.message.toLowerCase()).toContain("validação")
  })

  it("Pro sem evidence_coverage: fallback Y% via score", () => {
    const r = buildAggregateSolidityDiagnosticMessage({
      score: 0.45,
      evidenceCoverage01: null,
      isPro: true,
    })
    expect(r.reviewPct).toBe(55)
    expect(r.message).toContain("55%")
  })

  it("Free: mensagem sem percentagem, mantém alerta de validação", () => {
    const r = buildAggregateSolidityDiagnosticMessage({
      score: redScore,
      evidenceCoverage01: 0.3,
      isPro: false,
    })
    expect(r.reviewPct).toBeNull()
    expect(r.message).not.toMatch(/\d+%/)
    expect(r.message.toLowerCase()).toContain("validação")
  })
})
