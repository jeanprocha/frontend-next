import { describe, expect, it } from "vitest"
import { DEMO_SCENARIOS, materializeDemoScenario } from "./demo-scenarios"

describe("DEMO_SCENARIOS", () => {
  it("tem 3 cenários, cada um num regime diferente", () => {
    expect(DEMO_SCENARIOS).toHaveLength(3)
    const regimes = new Set(DEMO_SCENARIOS.map((s) => s.companyRegime))
    expect(regimes.size).toBe(3)
  })

  it("todo cenário tem ao menos um serviço e uma despesa preenchidos", () => {
    for (const scenario of DEMO_SCENARIOS) {
      expect(scenario.services.length).toBeGreaterThan(0)
      expect(scenario.expenses.length).toBeGreaterThan(0)
      for (const s of scenario.services) {
        expect(s.description.trim()).not.toBe("")
        expect(s.amount.trim()).not.toBe("")
      }
      for (const e of scenario.expenses) {
        expect(e.description.trim()).not.toBe("")
        expect(e.amount.trim()).not.toBe("")
      }
    }
  })

  it("ids dos cenários são únicos", () => {
    const ids = DEMO_SCENARIOS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("materializeDemoScenario", () => {
  it("preserva contexto e regime do cenário", () => {
    const scenario = DEMO_SCENARIOS[0]
    const m = materializeDemoScenario(scenario)
    expect(m.companyContext).toBe(scenario.companyContext)
    expect(m.companyRegime).toBe(scenario.companyRegime)
  })

  it("gera ids frescos para cada linha de serviço e despesa", () => {
    const scenario = DEMO_SCENARIOS[0]
    const m = materializeDemoScenario(scenario)
    expect(m.services).toHaveLength(scenario.services.length)
    expect(m.expenses).toHaveLength(scenario.expenses.length)
    for (const s of m.services) expect(s.id).toBeTruthy()
    for (const e of m.expenses) expect(e.id).toBeTruthy()
  })

  it("duas materializações do mesmo cenário produzem ids diferentes (recarregar não colide)", () => {
    const scenario = DEMO_SCENARIOS[0]
    const a = materializeDemoScenario(scenario)
    const b = materializeDemoScenario(scenario)
    expect(a.services[0].id).not.toBe(b.services[0].id)
    expect(a.expenses[0].id).not.toBe(b.expenses[0].id)
  })

  it("não perde nem embaralha descrição/valor/alíquota ao materializar", () => {
    const scenario = DEMO_SCENARIOS[1]
    const m = materializeDemoScenario(scenario)
    m.services.forEach((s, i) => {
      expect(s.description).toBe(scenario.services[i].description)
      expect(s.amount).toBe(scenario.services[i].amount)
      expect(s.iss_rate).toBe(scenario.services[i].iss_rate)
    })
    m.expenses.forEach((e, i) => {
      expect(e.description).toBe(scenario.expenses[i].description)
      expect(e.amount).toBe(scenario.expenses[i].amount)
    })
  })
})
