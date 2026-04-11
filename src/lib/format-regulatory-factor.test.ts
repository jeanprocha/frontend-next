import { describe, expect, it } from "vitest"
import {
  formatRegulatoryFactorDisplay,
  formatRegulatoryFactorPair,
} from "@/lib/format-regulatory-factor"

describe("formatRegulatoryFactorDisplay", () => {
  it("formats 0–1 decimals as Brazilian percentage", () => {
    expect(formatRegulatoryFactorDisplay("0.400000")).toBe("40,00%")
    expect(formatRegulatoryFactorDisplay("0.11")).toBe("11,00%")
    expect(formatRegulatoryFactorDisplay("0")).toBe("0,00%")
    expect(formatRegulatoryFactorDisplay("1")).toBe("100,00%")
    expect(formatRegulatoryFactorDisplay("1.000000")).toBe("100,00%")
  })

  it("returns original string when outside 0–1", () => {
    expect(formatRegulatoryFactorDisplay("1.5")).toBe("1.5")
    expect(formatRegulatoryFactorDisplay("-0.1")).toBe("-0.1")
  })

  it("returns original for non-numeric", () => {
    expect(formatRegulatoryFactorDisplay("input_static")).toBe("input_static")
  })

  it("handles empty and dash", () => {
    expect(formatRegulatoryFactorDisplay("")).toBe("—")
    expect(formatRegulatoryFactorDisplay("—")).toBe("—")
    expect(formatRegulatoryFactorDisplay(null)).toBe("—")
  })
})

describe("formatRegulatoryFactorPair", () => {
  it("formats two factors", () => {
    expect(formatRegulatoryFactorPair("0.12", "0.05")).toBe("12,00% / 5,00%")
  })
})
