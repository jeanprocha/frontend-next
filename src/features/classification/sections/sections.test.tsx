import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { dossieRagSection } from "./dossie-rag"
import { coberturaLegalAuditoriaSection } from "./cobertura-legal-auditoria"
import { mesaRastreabilidadeSection } from "./mesa-rastreabilidade"
import { fundamentacaoCreditosSection } from "./fundamentacao-creditos"
import type { ReportSection, ReportSectionProps, SimulationRecord } from "@/lib/report-contract"

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
    // Sem aiMetadata, sem meta, sem reportBrand, sem companyRegime.
  }
}

const baseProps: ReportSectionProps = {
  record: minimalRecord(),
  mode: "board",
  focusYear: 2026,
}

const SECTIONS: ReportSection[] = [
  dossieRagSection,
  coberturaLegalAuditoriaSection,
  mesaRastreabilidadeSection,
  fundamentacaoCreditosSection,
]

describe("secções classificationReportSections — smoke com registo mínimo/antigo", () => {
  for (const s of SECTIONS) {
    it(`${s.id} não rebenta sem aiMetadata, classifications, expenses ou credit_leaks`, () => {
      // fundamentacaoCreditosSection chama useLawCorpus() (PR 10) — precisa de QueryClientProvider.
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <s.Component {...baseProps} />
        </QueryClientProvider>,
      )
      expect(container).not.toBeEmptyDOMElement()
    })
  }
})
