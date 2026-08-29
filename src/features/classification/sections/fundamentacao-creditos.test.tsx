import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fundamentacaoCreditosSection } from "./fundamentacao-creditos"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import type { ClassificationItem } from "@/types/api"

const EVIDENCE = {
  article_id: "lc214_0047_art_47_p1_ix",
  content:
    "IX — bens e serviços utilizados na prestação de serviços que constituam a atividade econômica principal do contribuinte.",
  similarity: 0.91,
  legal_path: { article_label: "Art. 47", paragraph: "§ 1º", inciso: "IX" },
  relevant_snippets: ["bens e serviços utilizados na prestação de serviços"],
}

const BASE_CLASSIFICATION: ClassificationItem = {
  client_id: "exp-1",
  description: "Infraestrutura em nuvem",
  is_eligible: true,
  confidence: 0.92,
  justification: "Serviço tomado de fornecedor no regime regular, vinculado à atividade-fim da empresa.",
  legal_base: "Art. 47, § 1º, IX — LC 214/2025",
  risk_level: "medio",
  regime_type: "padrao",
  evidence: [EVIDENCE],
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
    expenses: [{ id: "exp-1", description: "Infraestrutura em nuvem", amount: "4000.00" }],
    services: [],
  }
}

function renderSection(mode: ReportSectionProps["mode"], classifications: ClassificationItem[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const props: ReportSectionProps = { record: recordCom(classifications), mode, focusYear: 2026 }
  return render(
    <QueryClientProvider client={queryClient}>
      <fundamentacaoCreditosSection.Component {...props} />
    </QueryClientProvider>,
  )
}

// B1: com a Mesa restrita a screen-tabs, a Fundamentação de créditos é a
// única cédula do documento — cobre também a trilha de divergência
// (DivergenceTrailPrint) que antes vivia só dentro da Mesa.
describe("fundamentacaoCreditosSection — cédula canônica", () => {
  // O porquê e a citação são montados duas vezes no DOM por design — linha de
  // detalhe da tabela (≥ sm/impressão) e cartão mobile (< sm), só uma visível
  // por vez via CSS (mesmo padrão de plano-de-acao.tsx) — daí escopar à tabela.
  it("mostra o porquê e a citação da lei em modo apresentação (public-linear), sem qualquer interação", () => {
    const { container } = renderSection("public-linear", [BASE_CLASSIFICATION])
    const table = within(container.querySelector("table") as HTMLElement)

    expect(table.getByText(/Serviço tomado de fornecedor no regime regular/)).toBeInTheDocument()
    expect(table.getByText(/bens e serviços utilizados na prestação de serviços/)).toBeInTheDocument()
    expect(table.getByText(/Art\. 47 · § 1º · inciso IX/)).toBeInTheDocument()
    expect(table.getByText(/aderência textual 91%/)).toBeInTheDocument()
  })

  it("não invade a citação quando não há evidência recuperada", () => {
    const semEvidencia: ClassificationItem = { ...BASE_CLASSIFICATION, evidence: [] }
    const { container } = renderSection("public-linear", [semEvidencia])
    const table = within(container.querySelector("table") as HTMLElement)
    expect(table.getByText(/Sem citação — nenhum trecho da lei foi recuperado/)).toBeInTheDocument()
  })

  it("o botão \"Ver lei\" continua acessível em modo apresentação (não é mais ocultado)", () => {
    renderSection("board", [BASE_CLASSIFICATION])
    expect(screen.getByRole("button", { name: "Ver lei" })).toBeInTheDocument()
  })

  it("o cartão mobile traz descrição, valor e classificação sempre visíveis", () => {
    const { container } = renderSection("board", [BASE_CLASSIFICATION])
    const mobileList = container.querySelector("ul")
    expect(mobileList).not.toBeNull()
    const mobile = within(mobileList as HTMLElement)
    expect(mobile.getByText("Infraestrutura em nuvem")).toBeInTheDocument()
    expect(mobile.getByText(/4\.000,00/)).toBeInTheDocument()
    expect(mobile.getByText("Elegível")).toBeInTheDocument()
    expect(mobile.getByText(/Serviço tomado de fornecedor no regime regular/)).toBeInTheDocument()
  })

  it("o rótulo de risco sai acentuado (\"médio\", nunca o valor cru \"medio\")", () => {
    renderSection("board", [BASE_CLASSIFICATION])
    expect(screen.getAllByText("médio").length).toBeGreaterThan(0)
    expect(screen.queryByText("medio")).not.toBeInTheDocument()
  })

  it("a trilha de divergência IA × consultor está no DOM sem qualquer interação", () => {
    const divergente: ClassificationItem = {
      ...BASE_CLASSIFICATION,
      consultant_override: {
        is_eligible: false,
        regime_type: "padrao",
        justification: "Não há nexo documental com a receita tributável.",
        overridden_at: "2026-08-28T14:30:00Z",
      },
    }
    renderSection("board", [divergente])

    expect(screen.getByText(/Sugerido pela IA:/)).toBeInTheDocument()
    expect(screen.getByText(/Definido pelo consultor:/)).toBeInTheDocument()
    expect(screen.getByText(/Não há nexo documental/)).toBeInTheDocument()
  })
})
