import { describe, expect, it } from "vitest"
import type { FormExpense, FormService } from "@/types/api"
import {
  clampSimulationYear,
  isValidAmount,
  isValidExpense,
  isValidService,
  parseLineAmount,
  SIMULATION_YEAR_MAX,
  SIMULATION_YEAR_MIN,
  validateSimulationLines,
} from "./simulation-line-helpers"

function svc(over: Partial<FormService> = {}): FormService {
  return { id: "s1", description: "Consultoria", amount: "1000.00", iss_rate: "0.05", ...over }
}

function exp(over: Partial<FormExpense> = {}): FormExpense {
  return { id: "e1", description: "AWS", amount: "500.00", ...over }
}

describe("parseLineAmount (Etapa N/PR 7, fato 15)", () => {
  it("lê valor decimal normal", () => {
    expect(parseLineAmount("1200.50")).toBe(1200.5)
  })

  it("aceita vírgula decimal (mesmo formato do placeholder '0,00')", () => {
    expect(parseLineAmount("1200,50")).toBe(1200.5)
  })

  it("texto não-numérico vira 0 — mas de forma explícita (parseApiDecimal → null → 0), não '|| 0' escondendo o problema", () => {
    expect(parseLineAmount("abc")).toBe(0)
  })

  it("undefined/vazio vira 0", () => {
    expect(parseLineAmount(undefined)).toBe(0)
    expect(parseLineAmount("")).toBe(0)
  })
})

describe("isValidAmount", () => {
  it("aceita número com ponto ou vírgula", () => {
    expect(isValidAmount("1200.50")).toBe(true)
    expect(isValidAmount("1200,50")).toBe(true)
  })

  it("rejeita texto não-numérico", () => {
    expect(isValidAmount("abc")).toBe(false)
  })

  it("rejeita vazio/undefined", () => {
    expect(isValidAmount("")).toBe(false)
    expect(isValidAmount(undefined)).toBe(false)
  })
})

describe("isValidService / isValidExpense", () => {
  it("serviço com valor e alíquota numéricos é válido", () => {
    expect(isValidService(svc())).toBe(true)
  })

  it("serviço com valor não-numérico é inválido", () => {
    expect(isValidService(svc({ amount: "abc" }))).toBe(false)
  })

  it("serviço com alíquota não-numérica é inválido", () => {
    expect(isValidService(svc({ iss_rate: "abc" }))).toBe(false)
  })

  it("despesa com valor numérico é válida", () => {
    expect(isValidExpense(exp())).toBe(true)
  })

  it("despesa com valor não-numérico é inválida", () => {
    expect(isValidExpense(exp({ amount: "abc" }))).toBe(false)
  })
})

describe("clampSimulationYear (fato 15 — clamp, não rejeição)", () => {
  it("mantém ano já dentro do intervalo", () => {
    expect(clampSimulationYear(2028)).toBe(2028)
  })

  it("corrige ano abaixo do mínimo", () => {
    expect(clampSimulationYear(1999)).toBe(SIMULATION_YEAR_MIN)
  })

  it("corrige ano acima do máximo", () => {
    expect(clampSimulationYear(2050)).toBe(SIMULATION_YEAR_MAX)
  })

  it("NaN/Infinity cai no mínimo em vez de propagar", () => {
    expect(clampSimulationYear(NaN)).toBe(SIMULATION_YEAR_MIN)
    expect(clampSimulationYear(Infinity)).toBe(SIMULATION_YEAR_MIN)
  })

  it("arredonda ano fracionário", () => {
    expect(clampSimulationYear(2027.6)).toBe(2028)
  })
})

describe("validateSimulationLines (fato 9 — fim do return silencioso)", () => {
  it("nenhum serviço preenchido: bloqueia com mensagem, sem citar despesas", () => {
    const r = validateSimulationLines([], [exp()])
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message).toContain("Adicione ao menos um serviço")
  })

  it("serviço com valor 'abc' é recusado antes de virar NaN — não some, vira mensagem citando a linha", () => {
    const bad = svc({ amount: "abc" })
    const r = validateSimulationLines([bad], [])
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message).toContain("Consultoria")
    expect(r.invalidLineIds).toEqual([bad.id])
  })

  it("serviço válido mas despesa com valor 'abc' também bloqueia (não é silenciosamente descartada)", () => {
    const badExp = exp({ amount: "abc" })
    const r = validateSimulationLines([svc()], [badExp])
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message).toContain("AWS")
    expect(r.invalidLineIds).toEqual([badExp.id])
  })

  it("tudo válido: retorna as linhas preenchidas, sem mensagem", () => {
    const r = validateSimulationLines([svc()], [exp()])
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.validServices).toHaveLength(1)
    expect(r.validExpenses).toHaveLength(1)
  })

  it("linhas em branco (não tocadas pelo usuário) são ignoradas, não contam como inválidas", () => {
    const blankExp: FormExpense = { id: "e2", description: "", amount: "" }
    const r = validateSimulationLines([svc()], [blankExp])
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.validExpenses).toHaveLength(0)
  })

  it("despesas são opcionais: serviço válido sem nenhuma despesa passa", () => {
    const r = validateSimulationLines([svc()], [])
    expect(r.ok).toBe(true)
  })
})
