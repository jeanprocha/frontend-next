import { describe, expect, it } from "vitest"
import {
  decimalStringToCents,
  formatBRL,
  formatDecimalPtBR,
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
    expect(formatPct("92.98")).toBe("93,0%")
    expect(formatPct("-10.5")).toBe("-10,5%")
  })

  // O backend Go emite decimal com ponto; a UI é PT-BR e usa vírgula, igual a
  // formatBRL. Regressão: as duas funções já emitiram "93.0%" em produção.
  it("emite vírgula decimal, nunca ponto", () => {
    expect(formatPct("40.82")).toBe("40,8%")
    expect(formatPct("40.82")).not.toContain(".")
  })
})

describe("formatPctFraction", () => {
  it("converte fração 0–1", () => {
    expect(formatPctFraction("0.05")).toBe("5,0%")
    expect(formatPctFraction(0.05)).toBe("5,0%")
  })

  it("emite vírgula decimal, nunca ponto", () => {
    expect(formatPctFraction("0.177")).not.toContain(".")
  })
})

describe("formatDecimalPtBR", () => {
  it("usa vírgula e respeita as casas pedidas", () => {
    expect(formatDecimalPtBR(7)).toBe("7,0")
    expect(formatDecimalPtBR(6.96)).toBe("7,0")
    expect(formatDecimalPtBR(1.234, 2)).toBe("1,23")
  })

  it("trata valor não finito", () => {
    expect(formatDecimalPtBR(Number.NaN)).toBe("—")
    expect(formatDecimalPtBR(Number.POSITIVE_INFINITY)).toBe("—")
  })
})
