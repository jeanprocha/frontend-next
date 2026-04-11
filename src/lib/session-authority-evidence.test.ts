import { describe, expect, it } from "vitest"
import {
  pickHeroEvidenceByFinancialVolume,
  pickRepresentativeEvidence,
  resolveHeroEvidencePick,
} from "@/lib/session-authority-evidence"
import type { ClassificationItem } from "@/types/api"

describe("pickRepresentativeEvidence", () => {
  it("returns null when no classifications", () => {
    expect(pickRepresentativeEvidence([])).toBeNull()
  })

  it("picks evidence with highest similarity", () => {
    const items: ClassificationItem[] = [
      {
        description: "a",
        is_eligible: true,
        confidence: 0.9,
        justification: "",
        legal_base: "",
        risk_level: "low",
        regime_type: "padrao",
        evidence: [
          { article_id: "1", content: "low", similarity: 0.4 },
          { article_id: "2", content: "high", similarity: 0.92 },
        ],
      },
    ]
    const pick = pickRepresentativeEvidence(items)
    expect(pick?.evidence.content).toBe("high")
    expect(pick?.maxSimilarity).toBeCloseTo(0.92)
  })

  it("skips items with error", () => {
    const items: ClassificationItem[] = [
      {
        description: "x",
        is_eligible: true,
        confidence: 1,
        justification: "",
        legal_base: "",
        risk_level: "low",
        regime_type: "padrao",
        evidence: [{ article_id: "1", content: "t", similarity: 0.9 }],
        error: "fail",
      },
    ]
    expect(pickRepresentativeEvidence(items)).toBeNull()
  })
})

const baseRow = (over: Partial<ClassificationItem>): ClassificationItem => ({
  description: "d",
  is_eligible: true,
  confidence: 0.9,
  justification: "",
  legal_base: "",
  risk_level: "low",
  regime_type: "padrao",
  evidence: [],
  ...over,
})

describe("pickHeroEvidenceByFinancialVolume", () => {
  it("returns null when no expenses", () => {
    expect(pickHeroEvidenceByFinancialVolume([], [])).toBeNull()
  })

  it("picks article with largest sum of eligible expense amounts", () => {
    const expenses = [
      { id: "a", amount: "1000.00" },
      { id: "b", amount: "5000.00" },
    ]
    const items: ClassificationItem[] = [
      baseRow({
        client_id: "a",
        evidence: [{ article_id: "art_low", content: "x", similarity: 0.99 }],
      }),
      baseRow({
        client_id: "b",
        evidence: [{ article_id: "art_high", content: "y", similarity: 0.5 }],
      }),
    ]
    const pick = pickHeroEvidenceByFinancialVolume(items, expenses)
    expect(pick?.evidence.article_id).toBe("art_high")
    expect(pick?.totalBrl?.toFixed(2)).toBe("5000.00")
  })

  it("sums multiple lines to same article", () => {
    const expenses = [
      { id: "a", amount: "1000.00" },
      { id: "b", amount: "2000.00" },
    ]
    const items: ClassificationItem[] = [
      baseRow({
        client_id: "a",
        evidence: [{ article_id: "same", content: "x", similarity: 0.9 }],
      }),
      baseRow({
        client_id: "b",
        evidence: [{ article_id: "same", content: "y", similarity: 0.85 }],
      }),
    ]
    const pick = pickHeroEvidenceByFinancialVolume(items, expenses)
    expect(pick?.evidence.article_id).toBe("same")
    expect(pick?.totalBrl?.toFixed(2)).toBe("3000.00")
  })

  it("skips ineligible expenses", () => {
    const expenses = [{ id: "a", amount: "9000.00" }]
    const items: ClassificationItem[] = [
      baseRow({
        client_id: "a",
        is_eligible: false,
        evidence: [{ article_id: "only", content: "x", similarity: 0.9 }],
      }),
    ]
    expect(pickHeroEvidenceByFinancialVolume(items, expenses)).toBeNull()
  })
})

describe("resolveHeroEvidencePick", () => {
  it("falls back to representative when no financial hero", () => {
    const items: ClassificationItem[] = [
      baseRow({
        evidence: [{ article_id: "z", content: "solo", similarity: 0.95 }],
      }),
    ]
    const pick = resolveHeroEvidencePick(items, [])
    expect(pick?.evidence.content).toBe("solo")
    expect(pick?.totalBrl).toBeNull()
  })
})
