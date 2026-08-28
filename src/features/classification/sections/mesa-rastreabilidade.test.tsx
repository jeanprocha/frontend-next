import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { mesaRastreabilidadeSection } from "./mesa-rastreabilidade"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import type { ClassificationItem } from "@/types/api"

const DIVERGENT_CLASSIFICATION: ClassificationItem = {
  client_id: "exp-1",
  description: "Licença de software ERP",
  is_eligible: true,
  confidence: 0.9,
  justification: "Insumo elegível a crédito.",
  legal_base: "Art. 47, LC 214/2025",
  risk_level: "baixo",
  regime_type: "padrao",
  evidence: [],
  consultant_override: {
    is_eligible: false,
    regime_type: "padrao",
    justification: "Não há nexo documental com a receita tributável.",
    overridden_at: "2026-08-28T14:30:00Z",
  },
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

function propsPara(record: SimulationRecord): ReportSectionProps {
  return { record, mode: "public-linear", focusYear: 2026 }
}

describe("mesaRastreabilidadeSection — trilha de divergência IA × consultor", () => {
  // O mesmo bug de classe que a PR 3 corrigiu no painel de trace: a única
  // superfície da divergência era um Tooltip do Radix — nunca entra no DOM
  // sem hover/foco. Este teste renderiza a seção do zero, sem clicar/passar
  // o mouse em nada (equivalente a reabrir um dossiê salvo noutra máquina,
  // achado 9), e prova que a divergência ainda assim está no DOM.
  it("a divergência está no DOM mesmo sem qualquer interação (hover/clique)", () => {
    render(<mesaRastreabilidadeSection.Component {...propsPara(recordCom([DIVERGENT_CLASSIFICATION]))} />)

    expect(screen.getByText(/Sugerido pela IA:/)).toBeInTheDocument()
    expect(screen.getByText(/Definido pelo consultor:/)).toBeInTheDocument()
    expect(screen.getByText(/Não há nexo documental/)).toBeInTheDocument()
  })

  it("sem nenhuma classificação divergente, a trilha não aparece", () => {
    const semDivergencia: ClassificationItem = { ...DIVERGENT_CLASSIFICATION, consultant_override: undefined }
    render(<mesaRastreabilidadeSection.Component {...propsPara(recordCom([semDivergencia]))} />)
    expect(screen.queryByText(/Sugerido pela IA:/)).not.toBeInTheDocument()
  })
})
