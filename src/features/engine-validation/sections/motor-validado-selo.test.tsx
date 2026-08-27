import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api"
import type { EngineValidationResponse } from "@/lib/api/engine"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import { motorValidadoSeloSection } from "./motor-validado-selo"

function minimalRecord(): SimulationRecord {
  return {
    simulation: {
      year: 2026,
      current: { gross_tax: "1000", credits: "0", net_tax: "1000" },
      projected: { gross_tax: "900", credits: "100", net_tax: "800" },
      delta: "-200",
      delta_pct: "-20",
    },
    classifications: [],
    expenses: [],
    services: [],
  }
}

const baseProps: ReportSectionProps = {
  record: minimalRecord(),
  mode: "public-linear",
  focusYear: 2026,
}

const VALIDATED_FIXTURE: EngineValidationResponse = {
  validated: true,
  reference: {
    name: "Calculadora de Tributos RFB/Serpro",
    url: "http://localhost:8080/api",
    // Formato "YYYY-MM-DD" sem hora — mesma regressão de fuso corrigida em
    // base-legal-selo.tsx (timeZone: "UTC").
    run_at: "2026-08-27",
  },
  scope: ["CBS", "IBS"],
  out_of_scope: ["PIS/COFINS", "ISS", "ICMS"],
  tolerance_brl: "0.01",
  cases: [{ year: 2026, cbs_tribia: "90.00", cbs_rfb: "90.00", ibs_tribia: "10.00", ibs_rfb: "10.00", divergente: false }],
  cases_total: 8,
  cases_divergent: 0,
}

const NOT_VALIDATED_FIXTURE: EngineValidationResponse = {
  validated: false,
  reference: {},
  scope: [],
  out_of_scope: [],
  cases: [],
  cases_total: 0,
  cases_divergent: 0,
}

/** Semeia o cache antes do render — evita depender de um fetch real ao vivo. */
function renderWithQueryData(seedData?: EngineValidationResponse) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (seedData) {
    queryClient.setQueryData(queryKeys.engineValidation.all, seedData)
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <motorValidadoSeloSection.Component {...baseProps} />
    </QueryClientProvider>,
  )
}

describe("motorValidadoSeloSection", () => {
  it("PRODUCT.md: sem dado ao vivo (query não resolveu), não renderiza nada", () => {
    const { container } = renderWithQueryData()
    expect(container).toBeEmptyDOMElement()
  })

  it("PRODUCT.md: validated:false (sem evidência gravada), não renderiza nada", () => {
    const { container } = renderWithQueryData(NOT_VALIDATED_FIXTURE)
    expect(container).toBeEmptyDOMElement()
  })

  it("com validação ao vivo, mostra escopo, contagem de casos e data em pt-BR", () => {
    renderWithQueryData(VALIDATED_FIXTURE)
    expect(screen.getByRole("note")).toHaveTextContent(
      "CBS + IBS validados contra a Calculadora de Tributos RFB — 8 casos, 27/08/2026",
    )
  })
})
