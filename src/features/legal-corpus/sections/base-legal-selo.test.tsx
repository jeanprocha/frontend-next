import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api"
import type { LawCorpusResponse } from "@/lib/api/legal"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import { baseLegalSeloSection } from "./base-legal-selo"

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

const CORPUS_FIXTURE: LawCorpusResponse = {
  documents: [
    {
      id: "lc68-2024",
      label: "LC 68/2024",
      version: "3.0",
      // Formato real do backend (internal/lawcorpus.CatalogEntry.PublishedAt): "YYYY-MM-DD",
      // sem hora — regressão do bug de fuso corrigido em formatDataBase (timeZone: "UTC").
      published_at: "2026-07-22",
      source_url: "https://example.com",
      chunk_prefix: "lc68_",
    },
  ],
  current_document_id: "lc68-2024",
  changelog: [],
}

/** Semeia o cache antes do render — evita depender de um fetch real ao vivo. */
function renderWithQueryData(seedData?: LawCorpusResponse) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (seedData) {
    queryClient.setQueryData(queryKeys.lawCorpus.all, seedData)
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <baseLegalSeloSection.Component {...baseProps} />
    </QueryClientProvider>,
  )
}

describe("baseLegalSeloSection", () => {
  it("PRODUCT.md: sem dado ao vivo (isLive false), não renderiza nada", () => {
    const { container } = renderWithQueryData()
    expect(container).toBeEmptyDOMElement()
  })

  it("com o corpus ao vivo no cache, mostra rótulo e data-base formatada em pt-BR", () => {
    renderWithQueryData(CORPUS_FIXTURE)
    expect(screen.getByRole("note")).toHaveTextContent("Base legal LC 68/2024 atualizada em 22/07/2026")
  })
})
