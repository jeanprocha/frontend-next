import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { CalculationTracePanel } from "./calculation-trace-panel"
import type { TaxBreakdown, RuleBasis } from "@/types/api"

const TRACED_BREAKDOWN: TaxBreakdown = {
  gross_tax: "1425.00",
  credits: "0.00",
  net_tax: "1425.00",
  components: { pis: "165.00", cofins: "760.00", iss: "500.00", cbs: "0", ibs: "0" },
  trace: [
    {
      item: "Consultoria",
      label: "ISS do serviço",
      formula: "valor do serviço × (alíquota ISS informada × fator de transição municipal do ano)",
      inputs: [
        { name: "valor_servico", value: "10000" },
        { name: "aliquota_iss_informada", value: "0.05" },
      ],
      output: "500",
      rounded: false,
    },
    { label: "Líquido do regime atual", formula: "bruto − créditos", output: "1425.00", rounded: true },
  ],
}

const UNTRACED_BREAKDOWN: TaxBreakdown = { gross_tax: "1425.00", credits: "0.00", net_tax: "1425.00" }

const BASIS: RuleBasis = { kind: "estimativa_oficial", note: "Alíquota de referência delegada ao Senado (Art. 349)." }

describe("CalculationTracePanel", () => {
  it("declara a ausência quando nenhum breakdown tem trace (registro antigo)", () => {
    render(<CalculationTracePanel current={UNTRACED_BREAKDOWN} projected={UNTRACED_BREAKDOWN} />)
    expect(screen.getByText(/não disponível para este registro/i)).toBeInTheDocument()
    expect(screen.queryByText("ISS do serviço")).not.toBeInTheDocument()
  })

  it("sem breakdown nenhum (undefined) também declara a ausência, sem quebrar", () => {
    render(<CalculationTracePanel />)
    expect(screen.getByText(/não disponível para este registro/i)).toBeInTheDocument()
  })

  it("renderiza os passos do trace quando presente", () => {
    render(<CalculationTracePanel current={TRACED_BREAKDOWN} />)
    expect(screen.getByText("ISS do serviço")).toBeInTheDocument()
    expect(screen.getByText("Consultoria")).toBeInTheDocument()
    expect(screen.getByText("Líquido do regime atual")).toBeInTheDocument()
  })

  it("mostra a proveniência (basis) quando presente", () => {
    render(<CalculationTracePanel current={TRACED_BREAKDOWN} basis={BASIS} />)
    expect(screen.getByText(/Estimativa oficial/i)).toBeInTheDocument()
    expect(screen.getByText(/Art\. 349/)).toBeInTheDocument()
  })

  it("não mostra callout de proveniência quando basis está ausente", () => {
    render(<CalculationTracePanel current={TRACED_BREAKDOWN} />)
    expect(screen.queryByText(/Art\. 349/)).not.toBeInTheDocument()
  })

  it("só mostra tributos com valor não-zero (MEI/Simples/imobiliário não decompõem)", () => {
    const zerado: TaxBreakdown = {
      ...TRACED_BREAKDOWN,
      components: { pis: "0", cofins: "0", iss: "0", cbs: "0", ibs: "0" },
    }
    render(<CalculationTracePanel current={zerado} />)
    expect(screen.queryByText("PIS:")).not.toBeInTheDocument()
  })

  it("mostra os tributos com valor real", () => {
    render(<CalculationTracePanel current={TRACED_BREAKDOWN} />)
    expect(screen.getByText("PIS:")).toBeInTheDocument()
    expect(screen.getByText("COFINS:")).toBeInTheDocument()
    // CBS/IBS são "0" neste fixture (regime legado) — não devem aparecer.
    expect(screen.queryByText("CBS:")).not.toBeInTheDocument()
  })
})
