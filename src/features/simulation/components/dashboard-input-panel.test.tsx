import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useTaxStore } from "@/store/useTaxStore"
import { DashboardInputPanel } from "./dashboard-input-panel"

// D1/Frente D — só o comportamento de composição do painel importa aqui
// (quando o convite de cenário fictício monta); a árvore pesada do
// formulário (ContextHub, TransactionRow, …) já não é o objeto deste teste.
vi.mock("./simulation-form", () => ({
  SimulationForm: () => <div data-testid="simulation-form-stub" />,
}))

const REGION_NAME = "Carregar cenário fictício de demonstração"

function renderPanel() {
  return render(
    <DashboardInputPanel
      importerEntries={[]}
      isComparing={false}
      loading={false}
      onFormSubmit={vi.fn()}
      onModeChange={vi.fn()}
    />,
  )
}

describe("DashboardInputPanel — convite de cenário fictício (D1)", () => {
  beforeEach(() => {
    useTaxStore.setState({ services: [], expenses: [] })
  })

  it("monta o convite proeminente quando o simulador está vazio", () => {
    renderPanel()
    expect(screen.getByRole("region", { name: REGION_NAME })).toBeInTheDocument()
  })

  it("não monta o convite quando já há serviços preenchidos (não sobrescrever trabalho em curso)", () => {
    useTaxStore.setState({
      services: [{ id: "s1", description: "Consultoria", amount: "1000", iss_rate: "5" }],
      expenses: [],
    })
    renderPanel()
    expect(screen.queryByRole("region", { name: REGION_NAME })).not.toBeInTheDocument()
  })

  it("não monta o convite quando já há despesas preenchidas", () => {
    useTaxStore.setState({
      services: [],
      expenses: [{ id: "e1", description: "Aluguel", amount: "500" }],
    })
    renderPanel()
    expect(screen.queryByRole("region", { name: REGION_NAME })).not.toBeInTheDocument()
  })
})
