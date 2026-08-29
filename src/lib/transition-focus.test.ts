import { describe, expect, it } from "vitest"
import { availableFocusYears, simulationAtFocusYear } from "./transition-focus"
import type { SimulationResponse } from "@/types/api"

function minimalSim(): SimulationResponse {
  return {
    year: 2028,
    current: { gross_tax: "100", credits: "10", net_tax: "90" },
    projected: { gross_tax: "200", credits: "20", net_tax: "180" },
    delta: "90",
    delta_pct: "100",
    transition_series: [
      {
        year: 2028,
        old_tax_net: "90",
        new_tax_net: "180",
        total_tax_net: "270",
        current: { gross_tax: "100", credits: "10", net_tax: "90" },
        projected: { gross_tax: "200", credits: "20", net_tax: "180" },
        delta: "90.00",
        delta_pct: "100.00",
      },
      {
        year: 2031,
        old_tax_net: "50",
        new_tax_net: "300",
        total_tax_net: "350",
        current: { gross_tax: "80", credits: "30", net_tax: "50" },
        projected: { gross_tax: "400", credits: "100", net_tax: "300" },
        delta: "250.00",
        delta_pct: "500.00",
      },
    ],
  }
}

describe("simulationAtFocusYear", () => {
  it("mantém base quando ano igual", () => {
    const b = minimalSim()
    const o = simulationAtFocusYear(b, 2028)
    expect(o.year).toBe(2028)
    expect(o.current.net_tax).toBe("90")
  })

  it("troca para ponto da série quando há breakdown", () => {
    const b = minimalSim()
    const o = simulationAtFocusYear(b, 2031)
    expect(o.year).toBe(2031)
    expect(o.current.net_tax).toBe("50")
    expect(o.projected.net_tax).toBe("300")
  })

  it("registos legados: só old_tax_net / new_tax_net ainda permitem foco", () => {
    const b: SimulationResponse = {
      year: 2028,
      current: { gross_tax: "1", credits: "0", net_tax: "1" },
      projected: { gross_tax: "2", credits: "0", net_tax: "2" },
      delta: "1",
      delta_pct: "100",
      transition_series: [
        {
          year: 2030,
          old_tax_net: "100.00",
          new_tax_net: "200.00",
          total_tax_net: "300.00",
        },
      ],
    }
    const o = simulationAtFocusYear(b, 2030)
    expect(o.year).toBe(2030)
    expect(o.current.net_tax).toBe("100.00")
    expect(o.projected.net_tax).toBe("200.00")
    expect(o.delta).toBe("100.00")
  })
})

describe("availableFocusYears", () => {
  it("deriva os anos da série de transição, ordenados", () => {
    const b = minimalSim()
    expect(availableFocusYears(b)).toEqual([2028, 2031])
  })

  it("não hardcoda 2026–2033 — respeita uma série menor", () => {
    const b: SimulationResponse = {
      ...minimalSim(),
      transition_series: [
        { year: 2029, old_tax_net: "1", new_tax_net: "2", total_tax_net: "3" },
      ],
    }
    expect(availableFocusYears(b)).toEqual([2029])
  })

  it("cai para [base.year] quando não há série (registro antigo)", () => {
    const b: SimulationResponse = { ...minimalSim(), transition_series: undefined }
    expect(availableFocusYears(b)).toEqual([2028])
  })

  it("remove duplicatas", () => {
    const b: SimulationResponse = {
      ...minimalSim(),
      transition_series: [
        { year: 2027, old_tax_net: "1", new_tax_net: "2", total_tax_net: "3" },
        { year: 2027, old_tax_net: "1", new_tax_net: "2", total_tax_net: "3" },
      ],
    }
    expect(availableFocusYears(b)).toEqual([2027])
  })
})
