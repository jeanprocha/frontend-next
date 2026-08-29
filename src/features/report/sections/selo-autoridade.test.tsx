import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api"
import type { LawCorpusResponse } from "@/lib/api/legal"
import type { EngineValidationResponse } from "@/lib/api/engine"
import type { ClassificationItem } from "@/types/api"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import { seloAutoridadeSection } from "./selo-autoridade"

function classification(articleIds: string[]): ClassificationItem {
  return {
    description: "Licença de software",
    is_eligible: true,
    confidence: 0.9,
    justification: "…",
    legal_base: "Art. 47",
    risk_level: "baixo",
    regime_type: "padrao",
    evidence: articleIds.map((article_id) => ({ article_id, content: "…", similarity: 0.8 })),
  }
}

function recordCiting(articleIds: string[]): SimulationRecord {
  return {
    simulation: {
      year: 2026,
      current: { gross_tax: "1000", credits: "0", net_tax: "1000" },
      projected: { gross_tax: "900", credits: "100", net_tax: "800" },
      delta: "-200",
      delta_pct: "-20",
    },
    classifications: articleIds.length > 0 ? [classification(articleIds)] : [],
    expenses: [],
    services: [],
  }
}

function propsFor(articleIds: string[]): ReportSectionProps {
  return { record: recordCiting(articleIds), mode: "public-linear", focusYear: 2026 }
}

const LC214_DOC = {
  id: "lc214-2025",
  label: "LC 214/2025",
  version: "4.0",
  published_at: "2026-01-16",
  source_url: "https://example.com/lc214",
  chunk_prefix: "lc214_",
}

const CORPUS_LIVE: LawCorpusResponse = {
  documents: [LC214_DOC],
  current_document_id: "lc214-2025",
  changelog: [],
}

const VALIDATION_LIVE: EngineValidationResponse = {
  validated: true,
  reference: {
    name: "Calculadora de Tributos RFB/Serpro",
    url: "http://localhost:8080/api",
    version: "1.0.0-beta",
    run_at: "2026-08-27",
  },
  scope: ["CBS", "IBS"],
  out_of_scope: ["PIS/COFINS", "ISS", "ICMS"],
  tolerance_brl: "0.01",
  cases: [],
  cases_total: 8,
  cases_divergent: 0,
}

const VALIDATION_NOT_LIVE: EngineValidationResponse = {
  validated: false,
  reference: {},
  scope: [],
  out_of_scope: [],
  cases: [],
  cases_total: 0,
  cases_divergent: 0,
}

/** Semeia os dois caches (corpus legal + validação do motor) antes do render. */
function renderWith(
  lawSeed: LawCorpusResponse | undefined,
  validationSeed: EngineValidationResponse | undefined,
  props: ReportSectionProps,
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (lawSeed) queryClient.setQueryData(queryKeys.lawCorpus.all, lawSeed)
  if (validationSeed) queryClient.setQueryData(queryKeys.engineValidation.all, validationSeed)
  return render(
    <QueryClientProvider client={queryClient}>
      <seloAutoridadeSection.Component {...props} />
    </QueryClientProvider>,
  )
}

describe("seloAutoridadeSection", () => {
  it("os dois lados live: base legal citada + motor validado com escopo, versão, casos e cobertura", () => {
    renderWith(CORPUS_LIVE, VALIDATION_LIVE, propsFor(["lc214_0010_art_10"]))
    expect(screen.getByRole("note", { name: /^Base legal: LC 214\/2025 · data-base 16\/01\/2026$/ })).toBeInTheDocument()
    expect(
      screen.getByRole("note", {
        name: /^Motor validado: CBS \+ IBS · Calculadora RFB 1\.0\.0-beta · 8 casos · 27\/08\/2026 · divergência zero$/,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("Não cobre: PIS/COFINS, ISS, ICMS.")).toBeInTheDocument()
  })

  it("um lado ausente (registro sem citação reconhecível): declara explicitamente, não some", () => {
    renderWith(CORPUS_LIVE, VALIDATION_LIVE, propsFor([]))
    expect(
      screen.getByRole("note", { name: "Base legal: Sem citação de base legal identificável neste registro" }),
    ).toBeInTheDocument()
    // O outro lado continua afirmando o que sustenta — honestidade é por metade.
    expect(screen.getByRole("note", { name: /^Motor validado: CBS \+ IBS/ })).toBeInTheDocument()
  })

  it("um lado ausente (motor não validado): declara explicitamente, não some", () => {
    renderWith(CORPUS_LIVE, VALIDATION_NOT_LIVE, propsFor(["lc214_0010_art_10"]))
    expect(
      screen.getByRole("note", { name: "Motor validado: selo indisponível nesta emissão" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("note", { name: /^Base legal: LC 214\/2025/ })).toBeInTheDocument()
  })

  it("nenhum live: a faixa continua montada (nunca some), com as duas declarações explícitas", () => {
    const { container } = renderWith(undefined, undefined, propsFor([]))
    expect(container).not.toBeEmptyDOMElement()
    expect(
      screen.getByRole("note", { name: "Base legal: Selo de base legal indisponível nesta emissão" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("note", { name: "Motor validado: selo indisponível nesta emissão" }),
    ).toBeInTheDocument()
  })
})
