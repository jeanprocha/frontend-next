import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MotorGoTransitionTimeline } from "./cronograma"

describe("MotorGoTransitionTimeline — atalhos de ano (D2)", () => {
  it("marca o chip do ano de foco como pressionado (aria-pressed) e os outros como não", () => {
    render(
      <MotorGoTransitionTimeline years={[2026, 2029, 2033]} focusYear={2029} onFocusYearChange={vi.fn()} />,
    )
    expect(screen.getByRole("button", { name: "Focar no ano 2029" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Focar no ano 2026" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "Focar no ano 2033" })).toHaveAttribute("aria-pressed", "false")
  })

  it("clicar num chip chama onFocusYearChange com o ano do chip — atalho vivo, não decorativo", async () => {
    const onFocusYearChange = vi.fn()
    render(
      <MotorGoTransitionTimeline years={[2026, 2029, 2033]} focusYear={2026} onFocusYearChange={onFocusYearChange} />,
    )
    await userEvent.click(screen.getByRole("button", { name: "Focar no ano 2033" }))
    expect(onFocusYearChange).toHaveBeenCalledWith(2033)
  })

  it("sem onFocusYearChange, os anos aparecem como texto simples — nunca um controle fake clicável", () => {
    render(<MotorGoTransitionTimeline years={[2026, 2029]} focusYear={2026} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(screen.getByText("2026")).toBeInTheDocument()
  })
})
