import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { mesaRastreabilidadeSection } from "./mesa-rastreabilidade"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import type { ClassificationItem } from "@/types/api"

const CLASSIFICATION: ClassificationItem = {
  client_id: "exp-1",
  description: "Licença de software ERP",
  is_eligible: true,
  confidence: 0.9,
  justification: "Insumo elegível a crédito.",
  legal_base: "Art. 47, LC 214/2025",
  risk_level: "baixo",
  regime_type: "padrao",
  evidence: [],
}

function recordCom(classifications: ClassificationItem[]): SimulationRecord {
  return {
    simulation: {
      year: 2026,
      current: { gross_tax: "1425.00", credits: "0", net_tax: "1425.00" },
      projected: { gross_tax: "100.00", credits: "0", net_tax: "100.00" },
      delta: "-1325.00",
      delta_pct: "-92.98",
    },
    classifications,
    expenses: [{ id: "exp-1", description: "Licença de software ERP", amount: "3000.00" }],
    services: [],
  }
}

function propsPara(record: SimulationRecord, mode: ReportSectionProps["mode"]): ReportSectionProps {
  return { record, mode, focusYear: 2026 }
}

// B1: a Mesa é a ferramenta de trabalho do consultor — existe SÓ na aba
// "Mesa" do dashboard (screen-tabs). No documento (board/public-linear) e no
// impresso desses modos, a cédula canônica é a Fundamentação de créditos;
// duas tabelas com as mesmas despesas era o achado do critique ("Mesa +
// Fundamentação = as mesmas 15 despesas 2x").
describe("mesaRastreabilidadeSection — montagem por modo", () => {
  it("monta em screen-tabs", () => {
    render(
      <mesaRastreabilidadeSection.Component {...propsPara(recordCom([CLASSIFICATION]), "screen-tabs")} />,
    )
    expect(screen.getByText("Mesa de operações")).toBeInTheDocument()
    expect(screen.getByText("Licença de software ERP")).toBeInTheDocument()
  })

  it("não monta em board (a cédula canônica é a Fundamentação de créditos)", () => {
    const { container } = render(
      <mesaRastreabilidadeSection.Component {...propsPara(recordCom([CLASSIFICATION]), "board")} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("não monta em public-linear (dossiê público)", () => {
    const { container } = render(
      <mesaRastreabilidadeSection.Component {...propsPara(recordCom([CLASSIFICATION]), "public-linear")} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
