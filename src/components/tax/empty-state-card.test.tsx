import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EmptyStateCard } from "./empty-state-card"

describe("EmptyStateCard", () => {
  it("expõe o aria-label do passo 1 (contrato de locator do smoke E2E) e dispara onAdd", async () => {
    const onAdd = vi.fn()
    render(<EmptyStateCard type="service" onAdd={onAdd} />)

    await userEvent.click(
      screen.getByRole("button", {
        name: "Passo 1 do pipeline: adicionar primeiro serviço ou receita",
      }),
    )

    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it("expõe o aria-label do passo 2 (contrato de locator do smoke E2E) e dispara onAdd", async () => {
    const onAdd = vi.fn()
    render(<EmptyStateCard type="expense" onAdd={onAdd} />)

    await userEvent.click(
      screen.getByRole("button", {
        name: "Passo 2 do pipeline: adicionar primeira despesa para análise de créditos com IA e RAG",
      }),
    )

    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
