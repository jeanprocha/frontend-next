import { describe, expect, it } from "vitest"
import { aggregateClassifications } from "@/lib/classification-aggregates"
import type { ClassificationItem } from "@/types/api"

describe("aggregateClassifications", () => {
  it("computes mean and regime distribution", () => {
    const items: ClassificationItem[] = [
      {
        description: "a",
        is_eligible: true,
        confidence: 0.9,
        justification: "",
        legal_base: "",
        risk_level: "low",
        regime_type: "padrao",
        evidence: [],
      },
      {
        description: "b",
        is_eligible: true,
        confidence: 0.7,
        justification: "",
        legal_base: "",
        risk_level: "low",
        regime_type: "padrao",
        evidence: [],
      },
    ]
    const a = aggregateClassifications(items)
    expect(a.classifiedCount).toBe(2)
    expect(a.meanConfidence).toBeCloseTo(0.8)
    expect(a.regimeCounts.some((r) => r.key === "padrao" && r.pct === 100)).toBe(true)
  })

  it("flags hasRedLine when a line has low confidence", () => {
    const items: ClassificationItem[] = [
      {
        description: "a",
        is_eligible: true,
        confidence: 0.5,
        justification: "",
        legal_base: "",
        risk_level: "high",
        regime_type: "padrao",
        evidence: [],
      },
    ]
    const a = aggregateClassifications(items)
    expect(a.hasRedLine).toBe(true)
  })
})
