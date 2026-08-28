import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { planoDeAcaoSection } from "./plano-de-acao"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import type { CreditLeak, SimulationResponse } from "@/types/api"

function simulationCom(credit_leaks?: CreditLeak[]): SimulationResponse {
  return {
    year: 2026,
    current: { gross_tax: "1425.00", credits: "0", net_tax: "1425.00" },
    projected: { gross_tax: "100.00", credits: "0", net_tax: "100.00" },
    delta: "-1325.00",
    delta_pct: "-92.98",
    credit_leaks,
  }
}

function recordCom(credit_leaks?: CreditLeak[]): SimulationRecord {
  return { simulation: simulationCom(credit_leaks), classifications: [], expenses: [], services: [] }
}

function propsPara(record: SimulationRecord): ReportSectionProps {
  return { record, mode: "public-linear", focusYear: 2026 }
}

describe("planoDeAcaoSection", () => {
  it("registrada com id/print/screenTab corretos", () => {
    expect(planoDeAcaoSection.id).toBe("plano-de-acao")
    expect(planoDeAcaoSection.print).toBe("always")
    expect(planoDeAcaoSection.screenTab).toBe("cronograma")
  })

  it("sem credit_leaks, a seção não monta (perfis MEI/Simples/entidade imune já vêm sem leaks do backend)", () => {
    const { container } = render(<planoDeAcaoSection.Component {...propsPara(recordCom(undefined))} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("com credit_leaks vazio, também não monta", () => {
    const { container } = render(<planoDeAcaoSection.Component {...propsPara(recordCom([]))} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("mostra ação, prioridade, esforço/risco, base legal, motivo→sugestão e o total no rodapé", () => {
    const leaks: CreditLeak[] = [
      {
        description: "Licença de software ERP",
        value: "3000.00",
        lost_credit: "30.00",
        reason: "Sem nexo documental com a receita tributável.",
        fix: "Reclassificar como elegível padrão com a documentação de nexo.",
        regime_type: "padrao",
        legal_base: "Art. 47, LC 214/2025",
        effort: "baixo",
        risk: "baixo",
        priority: "alta",
        annual_values: [{ year: 2026, lost_credit: "30.00" }],
      },
    ]
    render(<planoDeAcaoSection.Component {...propsPara(recordCom(leaks))} />)

    expect(screen.getByText("Licença de software ERP")).toBeInTheDocument()
    expect(screen.getByText("Alta")).toBeInTheDocument()
    expect(screen.getByText("baixo · baixo")).toBeInTheDocument()
    expect(screen.getByText("Art. 47, LC 214/2025")).toBeInTheDocument()
    expect(screen.getByText(/Sem nexo documental/)).toBeInTheDocument()
    expect(screen.getByText(/Reclassificar como elegível padrão/)).toBeInTheDocument()
    expect(screen.getByText("Total recuperável (ano simulado)")).toBeInTheDocument()
    expect(screen.getAllByText("−R$ 30,00").length).toBeGreaterThanOrEqual(2) // linha + total
  })

  it("item sem legal_base mostra o aviso de ausência, não inventa citação", () => {
    const leaks: CreditLeak[] = [
      { description: "Assinatura sem nexo claro", value: "500.00", lost_credit: "5.00", regime_type: "padrao" },
    ]
    render(<planoDeAcaoSection.Component {...propsPara(recordCom(leaks))} />)
    expect(screen.getByText("Sem citação — revisar com o fiscal antes de agir")).toBeInTheDocument()
  })

  it("ordena por valor acumulado (annual_values) decrescente, não pela ordem de chegada", () => {
    const leaks: CreditLeak[] = [
      {
        description: "Valor baixo acumulado",
        value: "100.00",
        lost_credit: "50.00", // maior no ano simulado...
        regime_type: "padrao",
        annual_values: [{ year: 2026, lost_credit: "50.00" }], // ...mas só um ano
      },
      {
        description: "Valor alto acumulado",
        value: "1000.00",
        lost_credit: "10.00", // menor no ano simulado...
        regime_type: "padrao",
        annual_values: [
          { year: 2026, lost_credit: "10.00" },
          { year: 2027, lost_credit: "88.00" },
          { year: 2033, lost_credit: "265.00" },
        ], // ...mas soma muito mais ao longo da transição
      },
    ]
    render(<planoDeAcaoSection.Component {...propsPara(recordCom(leaks))} />)
    const rows = screen.getAllByRole("row")
    // rows[0] é o cabeçalho; rows[1] deve ser o de maior valor acumulado.
    expect(rows[1]).toHaveTextContent("Valor alto acumulado")
    expect(rows[2]).toHaveTextContent("Valor baixo acumulado")
  })

  it("registo antigo (pré-PR5, sem annual_values/effort/risk/priority) não quebra e usa lost_credit como valor de ordenação", () => {
    const leaks: CreditLeak[] = [
      { description: "Despesa antiga", value: "1000.00", lost_credit: "10.00", regime_type: "padrao" },
    ]
    render(<planoDeAcaoSection.Component {...propsPara(recordCom(leaks))} />)
    expect(screen.getByText("Despesa antiga")).toBeInTheDocument()
    // "—" aparece duas vezes: prioridade desconhecida e esforço/risco desconhecidos.
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Total recuperável (ano simulado)")).toBeInTheDocument()
  })
})
