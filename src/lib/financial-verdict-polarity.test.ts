import { describe, expect, it } from "vitest"
import { deriveFinancialVerdictPolarity } from "./financial-verdict-polarity"

describe("deriveFinancialVerdictPolarity", () => {
  describe("invalid — campo ausente ou não parseável", () => {
    it("retorna 'invalid' para undefined", () => {
      expect(deriveFinancialVerdictPolarity(undefined)).toBe("invalid")
    })

    it("retorna 'invalid' para null", () => {
      expect(deriveFinancialVerdictPolarity(null)).toBe("invalid")
    })

    it("retorna 'invalid' para string vazia", () => {
      expect(deriveFinancialVerdictPolarity("")).toBe("invalid")
    })

    it("retorna 'invalid' para string só com espaços", () => {
      expect(deriveFinancialVerdictPolarity("   ")).toBe("invalid")
    })

    it("retorna 'invalid' para string não numérica", () => {
      expect(deriveFinancialVerdictPolarity("abc")).toBe("invalid")
    })

    it("retorna 'invalid' para string parcialmente numérica", () => {
      expect(deriveFinancialVerdictPolarity("123abc")).toBe("invalid")
    })
  })

  describe("neutral — zero matemático (incluindo -0.00)", () => {
    it("retorna 'neutral' para '0'", () => {
      expect(deriveFinancialVerdictPolarity("0")).toBe("neutral")
    })

    it("retorna 'neutral' para '0.00'", () => {
      expect(deriveFinancialVerdictPolarity("0.00")).toBe("neutral")
    })

    it("retorna 'neutral' para '0.000'", () => {
      expect(deriveFinancialVerdictPolarity("0.000")).toBe("neutral")
    })

    it("retorna 'neutral' para '-0.00' (caso crítico — zero limítrofe com prefixo negativo)", () => {
      // Motor Go pode emitir "-0.00" em transições onde o delta arredondado é zero.
      // parseFloat("-0.00") < 0 === false em JS, mas o módulo NÃO usa parseFloat.
      // Decimal("-0.00").isZero() === true — comportamento correcto.
      expect(deriveFinancialVerdictPolarity("-0.00")).toBe("neutral")
    })

    it("retorna 'neutral' para '-0.000'", () => {
      expect(deriveFinancialVerdictPolarity("-0.000")).toBe("neutral")
    })

    it("retorna 'neutral' com espaços envolventes", () => {
      expect(deriveFinancialVerdictPolarity("  0.00  ")).toBe("neutral")
    })
  })

  describe("economy — delta negativo (carga projetada menor)", () => {
    it("retorna 'economy' para '-1'", () => {
      expect(deriveFinancialVerdictPolarity("-1")).toBe("economy")
    })

    it("retorna 'economy' para '-12345.67'", () => {
      expect(deriveFinancialVerdictPolarity("-12345.67")).toBe("economy")
    })

    it("retorna 'economy' para '-0.01' (centavo)", () => {
      expect(deriveFinancialVerdictPolarity("-0.01")).toBe("economy")
    })

    it("retorna 'economy' para valor de alta precisão negativo", () => {
      expect(deriveFinancialVerdictPolarity("-9876543.12")).toBe("economy")
    })

    it("aceita vírgula como separador decimal (normalização parseApiDecimal)", () => {
      expect(deriveFinancialVerdictPolarity("-1234,56")).toBe("economy")
    })
  })

  describe("increase — delta positivo (carga projetada maior)", () => {
    it("retorna 'increase' para '1'", () => {
      expect(deriveFinancialVerdictPolarity("1")).toBe("increase")
    })

    it("retorna 'increase' para '12345.67'", () => {
      expect(deriveFinancialVerdictPolarity("12345.67")).toBe("increase")
    })

    it("retorna 'increase' para '0.01' (centavo positivo)", () => {
      expect(deriveFinancialVerdictPolarity("0.01")).toBe("increase")
    })

    it("retorna 'increase' para valor de alta precisão positivo", () => {
      expect(deriveFinancialVerdictPolarity("9876543.12")).toBe("increase")
    })
  })
})
