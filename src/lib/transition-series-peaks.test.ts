import { describe, expect, it } from "vitest"
import {
  peakYearMaxDelta,
  peakYearMaxDestinationNet,
  parseTransitionMoney,
} from "./transition-series-peaks"
import type { TransitionSeriesPoint } from "@/types/api"

function pt(y: number, newNet: string, delta: string): TransitionSeriesPoint {
  return {
    year: y,
    old_tax_net: "0",
    new_tax_net: newNet,
    total_tax_net: newNet,
    delta,
    delta_pct: "0",
  }
}

describe("parseTransitionMoney", () => {
  it("parses standard API strings", () => {
    expect(parseTransitionMoney("100.50")).toBe(100.5)
    expect(parseTransitionMoney(undefined)).toBeNaN()
  })
})

describe("peakYearMaxDestinationNet", () => {
  it("returns null for empty series", () => {
    expect(peakYearMaxDestinationNet(undefined)).toBeNull()
    expect(peakYearMaxDestinationNet([])).toBeNull()
  })

  it("finds year with maximum new_tax_net", () => {
    const s = [pt(2026, "10", "1"), pt(2031, "500", "100"), pt(2030, "400", "50")]
    expect(peakYearMaxDestinationNet(s)).toEqual({ year: 2031, value: "500.00" })
  })

  it("ties: earliest year wins", () => {
    const s = [pt(2028, "100", "0"), pt(2030, "100", "0")]
    expect(peakYearMaxDestinationNet(s)?.year).toBe(2028)
  })
})

describe("peakYearMaxDelta", () => {
  it("finds maximum delta", () => {
    const s = [pt(2027, "50", "10"), pt(2031, "200", "80"), pt(2030, "150", "30")]
    expect(peakYearMaxDelta(s)).toEqual({ year: 2031, value: "80.00" })
  })
})
