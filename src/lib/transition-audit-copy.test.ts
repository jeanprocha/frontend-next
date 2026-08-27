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
  it("returns explanation for 2026 (fase-teste — CBS e IBS ainda sobem juntos)", () => {
    const point: TransitionSeriesPoint = {
      year: 2026,
      old_tax_net: "0",
      new_tax_net: "0",
      total_tax_net: "0",
      current: { gross_tax: "0", credits: "0", net_tax: "0" },
      projected: { gross_tax: "100.00", credits: "5.00", net_tax: "95.00" },
      factors: {
        year: 2026,
        pis_cofins_factor: "1.000000",
        cbs_rate: "0.009000",
        ibs_rate: "0.001000",
        combined_projected_rate: "0.010000",
        iss_municipal_factor: "1.000000",
        iss_model: "input_static",
      },
    }
    const t = explainDestinationCredits(2026, point)
    expect(t).toBeTruthy()
    expect(t).toContain("2026")
    // 2026 não tem o adendo "CBS já entra praticamente plena" — só 2027+
    // (ver teste seguinte); em 2026 os dois tributos ainda sobem juntos.
    expect(t).not.toContain("CBS já entra praticamente plena")
  })

  // W7/B2.2: a partir de 2027 a CBS já entra praticamente plena (~8,7%); é o
  // IBS, mantido nominal em 0,1% até 2029, que represa a alíquota combinada.
  // O texto precisa dizer isso — "ainda em rampa" (versão anterior) seria
  // impreciso, já que só um dos dois tributos ainda está represado.
  it("returns explanation for 2027 distinguindo CBS plena de IBS represado", () => {
    const point: TransitionSeriesPoint = {
      year: 2027,
      old_tax_net: "0",
      new_tax_net: "0",
      total_tax_net: "0",
      current: { gross_tax: "0", credits: "0", net_tax: "0" },
      projected: { gross_tax: "1000.00", credits: "50.00", net_tax: "950.00" },
      factors: {
        year: 2027,
        pis_cofins_factor: "0.000000",
        cbs_rate: "0.087000",
        ibs_rate: "0.001000",
        combined_projected_rate: "0.088000",
        iss_municipal_factor: "1.000000",
        iss_model: "input_static",
      },
    }
    const t = explainDestinationCredits(2027, point)
    expect(t).toBeTruthy()
    expect(t).toContain("2027")
    expect(t).toContain("CBS já entra praticamente plena")
    expect(t).toContain("IBS")
  })

  it("returns null when factors missing", () => {
    expect(explainDestinationCredits(2027, { year: 2027, old_tax_net: "1", new_tax_net: "2", total_tax_net: "3" })).toBeNull()
  })
})
