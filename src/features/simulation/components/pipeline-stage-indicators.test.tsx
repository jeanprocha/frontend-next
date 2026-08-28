// Etapa N/PR 6 — cobre a corrente de etapas que substituiu os skeletons
// genéricos da fase "loading", e a remoção do `lg:hidden` da bússola (fato 8).
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { PipelineStageCompass, PipelineStageProgress } from "./pipeline-stage-indicators"

describe("PipelineStageCompass", () => {
  it("não tem mais lg:hidden — visível em qualquer largura de tela (fato 8)", () => {
    const { container } = render(<PipelineStageCompass stage="classification" />)
    expect(container.querySelector("p")?.className).not.toContain("lg:hidden")
  })

  it("continua aria-hidden — o anúncio para leitor de tela é feito por PipelineStageAnnouncer", () => {
    render(<PipelineStageCompass stage="simulation" />)
    expect(screen.getByText(/Etapa atual/).closest("p")).toHaveAttribute("aria-hidden", "true")
  })
})

describe("PipelineStageProgress", () => {
  it("marca as etapas anteriores como concluídas e a etapa corrente como ativa", () => {
    render(<PipelineStageProgress stage="simulation" shouldReduceMotion={false} />)
    // Contexto e Classificação (índices 0 e 1) já passaram — viram check.
    const checks = screen.getAllByText("✓")
    expect(checks).toHaveLength(2)
    // Veredito (índice 3, depois da corrente) ainda não chegou — mostra "4".
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("mostra a legenda da etapa corrente (mantra IA explica / Go calcula)", () => {
    render(<PipelineStageProgress stage="classification" shouldReduceMotion={false} />)
    expect(screen.getByText(/IA classifica cada despesa citando a legislação/)).toBeInTheDocument()
  })

  it("com stage='context', nenhuma etapa está concluída ainda", () => {
    render(<PipelineStageProgress stage="context" shouldReduceMotion={false} />)
    expect(screen.queryByText("✓")).not.toBeInTheDocument()
  })

  it("é decorativo — a árvore toda fica aria-hidden (Announcer cobre o leitor de tela)", () => {
    const { container } = render(<PipelineStageProgress stage="simulation" shouldReduceMotion={false} />)
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
  })

  it("com shouldReduceMotion, não deixa de mostrar a etapa ativa (só omite o pulso)", () => {
    render(<PipelineStageProgress stage="simulation" shouldReduceMotion={true} />)
    expect(screen.getByText(/motor fiscal calcula/i)).toBeInTheDocument()
  })
})
