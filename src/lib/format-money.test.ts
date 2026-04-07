import { describe, expect, it } from "vitest"
import {
  decimalStringToCents,
  formatBRL,
  formatPct,
  formatPctFraction,
  sanitizeDecimalString,
} from "./format-money"

describe("sanitizeDecimalString", () => {
  it("remove ruído e mantém um ponto (formato do backend Go)", () => {
    expect(sanitizeDecimalString("  1234.50 BRL ")).toBe("1234.50")
  })
})

describe("decimalStringToCents", () => {
  it("arredonda half-up na segunda casa", () => {
    expect(decimalStringToCents("1.005")).toBe(101n)
    expect(decimalStringToCents("1.004")).toBe(100n)
  })

  it("escala bilhões (Big Four) sem perda de precisão float", () => {
    const s = "1234567890123.45"
    expect(decimalStringToCents(s)).toBe(123456789012345n)
    expect(formatBRL(s)).toMatch(/1\.234\.567\.890\.123,45/)
  })
})

describe("formatBRL", () => {
  it("trata zero e inválido", () => {
    expect(formatBRL("0")).toMatch(/0,00/)
    expect(formatBRL("")).toBe("R$ —")
  })
})

describe("formatPct", () => {
  it("uma casa decimal com arredondamento", () => {
    expect(formatPct("92.98")).toBe("93.0%")
    expect(formatPct("-10.5")).toBe("-10.5%")
  })
})

describe("formatPctFraction", () => {
  it("converte fração 0–1", () => {
    expect(formatPctFraction("0.05")).toBe("5.0%")
    expect(formatPctFraction(0.05)).toBe("5.0%")
  })
})
