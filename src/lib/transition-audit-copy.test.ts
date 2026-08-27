import { describe, expect, it } from "vitest"
import { explainDestinationCredits, issModelDisplayLabel } from "./transition-audit-copy"
import type { TransitionSeriesPoint } from "@/types/api"

describe("issModelDisplayLabel", () => {
  it("nunca deixa o identificador cru do backend (com 'lc68' no nome) chegar à UI", () => {
    expect(issModelDisplayLabel("municipal_transition_lc68")).not.toContain("lc68")
    expect(issModelDisplayLabel("municipal_transition_lc68")).toBe("Transição municipal (rampa por ano)")
  })

  it("traduz input_static", () => {
    expect(issModelDisplayLabel("input_static")).toBe("Alíquota informada (sem rampa)")
  })

  it("valor desconhecido cai no próprio texto bruto (expand/contract: backend pode adicionar valores sem quebrar a UI)", () => {
    expect(issModelDisplayLabel("valor_futuro_desconhecido")).toBe("valor_futuro_desconhecido")
  })
})

describe("explainDestinationCredits", () => {
  it("returns ramp explanation for early transition years with low combined rate", () => {
    const point: TransitionSeriesPoint = {
      year: 2027,
      old_tax_net: "0",
      new_tax_net: "0",
      total_tax_net: "0",
      current: { gross_tax: "0", credits: "0", net_tax: "0" },
      projected: { gross_tax: "1000.00", credits: "50.00", net_tax: "950.00" },
      factors: {
        year: 2027,
        pis_cofins_factor: "0.700000",
        cbs_rate: "0.015000",
        ibs_rate: "0.035000",
        combined_projected_rate: "0.050000",
        iss_municipal_factor: "1.000000",
        iss_model: "input_static",
      },
    }
    const t = explainDestinationCredits(2027, point)
    expect(t).toBeTruthy()
    expect(t).toContain("rampa")
    expect(t).toContain("2027")
  })

  it("returns null when factors missing", () => {
    expect(explainDestinationCredits(2027, { year: 2027, old_tax_net: "1", new_tax_net: "2", total_tax_net: "3" })).toBeNull()
  })
})
