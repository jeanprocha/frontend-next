import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CapabilityProvider } from "@/features/plg"
import { getPlgCapabilities } from "@/features/plg"
import { ReportRenderer } from "./report-renderer"
import { dossieRagSection, fundamentacaoCreditosSection, mesaRastreabilidadeSection, vereditoSection } from "./sections"
import type { ReportRenderInput, ReportSection, ReportSectionProps } from "@/lib/report-contract"
import type { SimulationRecord } from "@/lib/report-contract"

function minimalRecord(): SimulationRecord {
  return {
    simulation: {
      year: 2026,
      current: { gross_tax: "1000", credits: "0", net_tax: "1000" },
      projected: { gross_tax: "900", credits: "100", net_tax: "800" },
      delta: "-200",
      delta_pct: "-20",
      // Registo antigo: sem transition_series, sem credit_leaks, sem strategy_insight.
    },
    classifications: [],
    expenses: [],
    services: [],
    // Sem aiMetadata, sem meta, sem reportBrand, sem companyRegime — campos todos opcionais.
  }
}

function stubSection(over: Partial<ReportSection>): ReportSection {
  return {
    id: over.id ?? "stub",
    title: over.title ?? "Stub",
    print: over.print ?? "always",
    screenTab: over.screenTab,
    capability: over.capability,
    Component: over.Component ?? (() => <div data-testid={`content-${over.id}`}>conteúdo</div>),
  }
}

const baseInput = (sections: ReportSection[], mode: ReportRenderInput["mode"]): ReportRenderInput => ({
  record: minimalRecord(),
  sections,
  mode,
  focusYear: 2026,
})

describe("ReportRenderer — matriz de modos", () => {
  const veredito = stubSection({ id: "v", screenTab: "veredito", print: "always" })
  const cronograma = stubSection({ id: "c", screenTab: "cronograma", print: "always" })
  const printOnly = stubSection({ id: "print", print: "print-only" })
  const boardOnly = stubSection({ id: "board", print: "board-only" })
  const sections = [printOnly, boardOnly, veredito, cronograma]

  it("screen-tabs: só a secção da aba activa (veredito, por omissão) monta; board-only não monta", () => {
    render(<ReportRenderer {...baseInput(sections, "screen-tabs")} />)
    expect(screen.getByTestId("content-v")).toBeInTheDocument()
    expect(screen.queryByTestId("content-c")).not.toBeInTheDocument()
    expect(screen.getByTestId("content-print")).toBeInTheDocument()
    expect(screen.queryByTestId("content-board")).not.toBeInTheDocument()
  })

  it("screen-tabs: trocar de aba monta a nova secção e desmonta a anterior", async () => {
    render(<ReportRenderer {...baseInput(sections, "screen-tabs")} />)
    await userEvent.click(screen.getByRole("button", { name: /CRONOGRAMA/i }))
    expect(screen.getByTestId("content-c")).toBeInTheDocument()
    expect(screen.queryByTestId("content-v")).not.toBeInTheDocument()
  })

  it("board: todas as secções elegíveis montam, incluindo board-only; sem índice de abas", () => {
    render(<ReportRenderer {...baseInput(sections, "board")} />)
    expect(screen.getByTestId("content-v")).toBeInTheDocument()
    expect(screen.getByTestId("content-c")).toBeInTheDocument()
    expect(screen.getByTestId("content-print")).toBeInTheDocument()
    expect(screen.getByTestId("content-board")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /CRONOGRAMA/i })).not.toBeInTheDocument()
  })

  it("public-linear: todas as secções de conteúdo montam; board-only não monta", () => {
    render(<ReportRenderer {...baseInput(sections, "public-linear")} />)
    expect(screen.getByTestId("content-v")).toBeInTheDocument()
    expect(screen.getByTestId("content-c")).toBeInTheDocument()
    expect(screen.getByTestId("content-print")).toBeInTheDocument()
    expect(screen.queryByTestId("content-board")).not.toBeInTheDocument()
  })
})

describe("ReportRenderer — capacidades", () => {
  const gated = stubSection({ id: "gated", screenTab: "veredito", capability: "legalOpinionTab" })

  it("secção com capability desligada não renderiza", () => {
    render(
      <CapabilityProvider value={getPlgCapabilities("free")}>
        <ReportRenderer {...baseInput([gated], "board")} />
      </CapabilityProvider>,
    )
    expect(screen.queryByTestId("content-gated")).not.toBeInTheDocument()
  })

  it("secção com capability ligada renderiza", () => {
    render(
      <CapabilityProvider value={getPlgCapabilities("premium")}>
        <ReportRenderer {...baseInput([gated], "board")} />
      </CapabilityProvider>,
    )
    expect(screen.getByTestId("content-gated")).toBeInTheDocument()
  })
})

describe("ReportRenderer — secções reais com registo mínimo/antigo (smoke)", () => {
  const REAL_SECTIONS: ReportSection[] = [
    vereditoSection,
    dossieRagSection,
    mesaRastreabilidadeSection,
    fundamentacaoCreditosSection,
  ]

  it("não rebenta com um registo sem aiMetadata, meta, transition_series ou credit_leaks (board)", () => {
    const { container } = render(<ReportRenderer {...baseInput(REAL_SECTIONS, "board")} />)
    expect(container).not.toBeEmptyDOMElement()
  })

  it("não rebenta em public-linear com o mesmo registo mínimo", () => {
    const { container } = render(<ReportRenderer {...baseInput(REAL_SECTIONS, "public-linear")} />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
