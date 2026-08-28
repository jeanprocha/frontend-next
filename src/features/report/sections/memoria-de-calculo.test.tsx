import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { memoriaDeCalculoSection } from "./memoria-de-calculo"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import type { TaxBreakdown } from "@/types/api"

const CURRENT: TaxBreakdown = {
  gross_tax: "1425.00",
  credits: "0.00",
  net_tax: "1425.00",
  components: { pis: "165.00", cofins: "760.00", iss: "500.00", cbs: "0", ibs: "0" },
  trace: [{ label: "Líquido do regime atual", formula: "bruto − créditos", output: "1425.00", rounded: true }],
}

const PROJECTED: TaxBreakdown = {
  gross_tax: "100.00",
  credits: "0.00",
  net_tax: "100.00",
  components: { pis: "0", cofins: "0", iss: "0", cbs: "90.00", ibs: "10.00" },
  trace: [{ label: "Líquido do regime projetado", formula: "bruto − créditos", output: "100.00", rounded: true }],
}

function recordCom(pontos: SimulationRecord["simulation"]["transition_series"]): SimulationRecord {
  return {
    simulation: {
      year: 2026,
      current: { gross_tax: "1425.00", credits: "0", net_tax: "1425.00" },
      projected: { gross_tax: "100.00", credits: "0", net_tax: "100.00" },
      delta: "-1325.00",
      delta_pct: "-92.98",
      transition_series: pontos,
    },
    classifications: [],
    expenses: [],
    services: [],
  }
}

function propsPara(record: SimulationRecord): ReportSectionProps {
  return { record, mode: "public-linear", focusYear: 2026 }
}

describe("memoriaDeCalculoSection", () => {
  it("registrada com id/print/screenTab corretos", () => {
    expect(memoriaDeCalculoSection.id).toBe("memoria-de-calculo")
    expect(memoriaDeCalculoSection.print).toBe("always")
    expect(memoriaDeCalculoSection.screenTab).toBe("cronograma")
  })

  it("registo sem série de transição não quebra", () => {
    const { container } = render(
      <memoriaDeCalculoSection.Component {...propsPara(recordCom(undefined))} />,
    )
    expect(container).toBeTruthy()
  })

  // O bug que esta PR corrige: o painel interativo é um collapsible que
  // COMEÇA FECHADO. window.print() (o mecanismo real de "Exportar para PDF")
  // imprime o DOM como está — sem o gêmeo sempre-visível, o conteúdo do
  // trace simplesmente não existiria no PDF enquanto o usuário não tivesse
  // clicado para abrir o painel na tela.
  it("o trace item a item está no DOM mesmo com o painel interativo fechado (nunca clicado)", () => {
    const record = recordCom([
      {
        year: 2026,
        old_tax_net: "1425.00",
        new_tax_net: "100.00",
        total_tax_net: "1525.00",
        current: CURRENT,
        projected: PROJECTED,
        delta: "-1325.00",
        delta_pct: "-92.98",
        factors: {
          year: 2026,
          pis_cofins_factor: "1.000000",
          cbs_rate: "0.009000",
          ibs_rate: "0.001000",
          basis: { kind: "lei_calendario", note: "Fase-teste fixada em lei (Art. 346/343)." },
        },
      },
    ])
    render(<memoriaDeCalculoSection.Component {...propsPara(record)} />)

    // Não clicamos em nada — o painel TransitionAuditPanel continua no
    // estado inicial (fechado). O gêmeo de impressão (hidden print:block)
    // ainda assim precisa estar presente no DOM.
    expect(screen.getByText("Líquido do regime atual")).toBeInTheDocument()
    expect(screen.getByText("Líquido do regime projetado")).toBeInTheDocument()
    // Aparece duas vezes: o rótulo do botão do painel interativo (sempre no
    // DOM, mesmo fechado) e o título do gêmeo de impressão — as duas
    // presenças são o próprio ponto do teste.
    expect(screen.getAllByText(/Memória de cálculo — 2026/)).toHaveLength(2)
  })

  it("registo sem trace (antigo) não renderiza o gêmeo de impressão, sem quebrar", () => {
    const record = recordCom([
      {
        year: 2026,
        old_tax_net: "1425.00",
        new_tax_net: "100.00",
        total_tax_net: "1525.00",
        current: { gross_tax: "1425.00", credits: "0", net_tax: "1425.00" },
        projected: { gross_tax: "100.00", credits: "0", net_tax: "100.00" },
      },
    ])
    render(<memoriaDeCalculoSection.Component {...propsPara(record)} />)
    expect(screen.queryByText("Líquido do regime atual")).not.toBeInTheDocument()
  })
})
