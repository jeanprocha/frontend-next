import { describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { ExpenseTable } from "./expense-table"
import type { ClassificationItem, FormExpense } from "@/types/api"

const EVIDENCE = {
  article_id: "lc214_0047_art_47_p1_ix",
  content:
    "IX — bens e serviços utilizados na prestação de serviços que constituam a atividade econômica principal do contribuinte.",
  similarity: 0.91,
  legal_path: { article_label: "Art. 47", paragraph: "§ 1º", inciso: "IX" },
  relevant_snippets: ["bens e serviços utilizados na prestação de serviços"],
}

const CLASSIFICATION: ClassificationItem = {
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

const EXPENSES: FormExpense[] = [{ id: "exp-1", description: "Infraestrutura em nuvem", amount: "4000.00" }]

describe("ExpenseTable — cédula de auditoria", () => {
  // O porquê e a citação são renderizados duas vezes no DOM por design — uma
  // vez na linha de detalhe da tabela (≥ sm/impressão), outra no cartão
  // mobile (< sm) — só uma delas fica visível por vez via CSS (mesmo padrão
  // de plano-de-acao.tsx). Por isso os testes abaixo escopam a asserção à
  // tabela (gêmeo mobile tem cobertura própria mais adiante).
  it("mostra o porquê e a citação sempre montados na tabela, sem hover/clique", () => {
    const { container } = render(<ExpenseTable expenses={EXPENSES} classifications={[CLASSIFICATION]} />)
    const table = within(container.querySelector("table") as HTMLElement)
    expect(table.getByText(/Serviço tomado de fornecedor no regime regular/)).toBeInTheDocument()
    expect(table.getByText(/bens e serviços utilizados na prestação de serviços/)).toBeInTheDocument()
    expect(table.getByText(/Art\. 47 · § 1º · inciso IX/)).toBeInTheDocument()
  })

  it("declara \"Sem citação\" em vez de inventar um trecho quando não há evidência", () => {
    const semEvidencia: ClassificationItem = { ...CLASSIFICATION, evidence: [] }
    const { container } = render(<ExpenseTable expenses={EXPENSES} classifications={[semEvidencia]} />)
    const table = within(container.querySelector("table") as HTMLElement)
    expect(table.getByText(/Sem citação — nenhum trecho da lei foi recuperado/)).toBeInTheDocument()
  })

  it("o sinal de confiança traz rótulo textual, não só cor", () => {
    render(<ExpenseTable expenses={EXPENSES} classifications={[CLASSIFICATION]} />)
    expect(screen.getAllByText("Sólido · 92%").length).toBeGreaterThan(0)
  })

  it("acentua o risco (\"médio\") e nunca mostra o valor cru \"medio\"", () => {
    render(<ExpenseTable expenses={EXPENSES} classifications={[CLASSIFICATION]} />)
    expect(screen.getAllByText("médio").length).toBeGreaterThan(0)
    expect(screen.queryByText("medio")).not.toBeInTheDocument()
  })

  it("o botão \"Ver lei\" está sempre presente (não há mais gating por apresentação)", () => {
    render(<ExpenseTable expenses={EXPENSES} classifications={[CLASSIFICATION]} />)
    expect(screen.getByRole("button", { name: "Ver lei" })).toBeInTheDocument()
  })

  it("o gêmeo mobile (cartão) traz descrição, valor e classificação sempre visíveis", () => {
    const { container } = render(<ExpenseTable expenses={EXPENSES} classifications={[CLASSIFICATION]} />)
    const mobileList = container.querySelector("ul")
    expect(mobileList).not.toBeNull()
    const mobile = within(mobileList as HTMLElement)
    expect(mobile.getByText("Infraestrutura em nuvem")).toBeInTheDocument()
    expect(mobile.getByText(/4\.000,00/)).toBeInTheDocument()
    expect(mobile.getByText("Elegível")).toBeInTheDocument()
  })

  it("sem classificação para a linha, mostra os fallbacks — nunca quebra", () => {
    render(<ExpenseTable expenses={EXPENSES} classifications={[]} />)
    expect(screen.getAllByText("—").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Sem classificação disponível/).length).toBeGreaterThan(0)
  })
})
