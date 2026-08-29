import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useTaxStore } from "@/store/useTaxStore"
import { DEMO_SCENARIOS } from "../lib/demo-scenarios"
import { DemoScenarioPicker } from "./demo-scenario-picker"

describe("DemoScenarioPicker (D1 — dados fictícios em um clique)", () => {
  it("rotula os dados como fictícios/demonstração (honestidade)", () => {
    render(<DemoScenarioPicker />)
    expect(
      screen.getByText(/dados fictícios, apenas para demonstração/i),
    ).toBeInTheDocument()
  })

  it("um clique preenche contexto, regime, receitas e despesas — sem disparar simulação", async () => {
    useTaxStore.setState({
      companyContext: "",
      services: [],
      expenses: [],
    })
    render(<DemoScenarioPicker />)

    const first = DEMO_SCENARIOS[0]
    await userEvent.click(screen.getByRole("button", { name: first.label }))

    const state = useTaxStore.getState()
    expect(state.companyContext).toBe(first.companyContext)
    expect(state.companyRegime).toBe(first.companyRegime)
    expect(state.services).toHaveLength(first.services.length)
    expect(state.expenses).toHaveLength(first.expenses.length)
    expect(state.services[0]?.description).toBe(first.services[0]?.description)
    // Não existe onSubmit aqui — o componente só materializa o formulário;
    // "Simular impacto" continua um clique explícito à parte (custo real de IA).
  })
})
