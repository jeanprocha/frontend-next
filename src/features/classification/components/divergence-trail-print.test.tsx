import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { DivergenceTrailPrint } from "./divergence-trail-print"
import type { ClassificationItem } from "@/types/api"

const BASE: ClassificationItem = {
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

describe("DivergenceTrailPrint", () => {
  it("sem itens com consultant_override, não renderiza nada", () => {
    const { container } = render(<DivergenceTrailPrint classifications={[BASE]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("mostra a sugestão da IA e a decisão do consultor para item divergente", () => {
    const divergente: ClassificationItem = {
      ...BASE,
      consultant_override: {
        is_eligible: false,
        regime_type: "padrao",
        justification: "Não há nexo documental com a receita tributável.",
        overridden_at: "2026-08-28T14:30:00Z",
      },
    }
    render(<DivergenceTrailPrint classifications={[divergente]} />)

    expect(screen.getByText("Licença de software ERP")).toBeInTheDocument()
    expect(screen.getByText(/Sugerido pela IA:/)).toBeInTheDocument()
    expect(screen.getByText(/Elegível · Padrão/)).toBeInTheDocument()
    expect(screen.getByText(/Definido pelo consultor:/)).toBeInTheDocument()
    expect(screen.getByText(/Não elegível a crédito/)).toBeInTheDocument()
    expect(screen.getByText(/Não há nexo documental/)).toBeInTheDocument()
  })

  it("sem justificativa, não mostra a linha de Nota do Especialista", () => {
    const divergente: ClassificationItem = {
      ...BASE,
      consultant_override: {
        is_eligible: false,
        regime_type: "padrao",
        overridden_at: "2026-08-28T14:30:00Z",
      },
    }
    render(<DivergenceTrailPrint classifications={[divergente]} />)
    expect(screen.queryByText(/Nota do Especialista/)).not.toBeInTheDocument()
  })

  it("mistura de itens: só os divergentes aparecem", () => {
    const semOverride: ClassificationItem = { ...BASE, client_id: "exp-2", description: "Aluguel do escritório" }
    const comOverride: ClassificationItem = {
      ...BASE,
      client_id: "exp-3",
      description: "Assinatura de streaming",
      consultant_override: {
        is_eligible: true,
        regime_type: "diferenciado_60",
        overridden_at: "2026-08-28T09:00:00Z",
      },
    }
    render(<DivergenceTrailPrint classifications={[semOverride, comOverride]} />)
    expect(screen.queryByText("Aluguel do escritório")).not.toBeInTheDocument()
    expect(screen.getByText("Assinatura de streaming")).toBeInTheDocument()
  })
})
