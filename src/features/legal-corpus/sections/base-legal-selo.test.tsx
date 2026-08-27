import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api"
import type { LawCorpusResponse } from "@/lib/api/legal"
import type { ClassificationItem } from "@/types/api"
import type { ReportSectionProps, SimulationRecord } from "@/lib/report-contract"
import { baseLegalSeloSection } from "./base-legal-selo"

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

const LC68_DOC = {
  id: "lc68-2024",
  label: "LC 68/2024",
  version: "3.0",
  // Formato real do backend (internal/lawcorpus.CatalogEntry.PublishedAt): "YYYY-MM-DD",
  // sem hora — regressão do bug de fuso corrigido em formatDataBase (timeZone: "UTC").
  published_at: "2026-07-22",
  source_url: "https://example.com/lc68",
  chunk_prefix: "lc68_",
}

const LC214_DOC = {
  id: "lc214-2025",
  label: "LC 214/2025",
  version: "4.0",
  published_at: "2026-01-16",
  source_url: "https://example.com/lc214",
  chunk_prefix: "lc214_",
}

const CORPUS_SO_LC68: LawCorpusResponse = {
  documents: [LC68_DOC],
  current_document_id: "lc68-2024",
  changelog: [],
}

/** Estado pós-Onda 2: a LC 214 é a corrente, mas a LC 68 continua no corpus. */
const CORPUS_POS_VIRADA: LawCorpusResponse = {
  documents: [LC68_DOC, LC214_DOC],
  current_document_id: "lc214-2025",
  changelog: [],
}

/** Semeia o cache antes do render — evita depender de um fetch real ao vivo. */
function renderWith(seedData: LawCorpusResponse | undefined, props: ReportSectionProps) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  if (seedData) {
    queryClient.setQueryData(queryKeys.lawCorpus.all, seedData)
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <baseLegalSeloSection.Component {...props} />
    </QueryClientProvider>,
  )
}

describe("baseLegalSeloSection", () => {
  it("PRODUCT.md: sem dado ao vivo (isLive false), não renderiza nada", () => {
    const { container } = renderWith(undefined, propsFor(["lc68_0052_art_52"]))
    expect(container).toBeEmptyDOMElement()
  })

  it("registro sem evidência reconhecível não afirma base legal nenhuma", () => {
    const { container } = renderWith(CORPUS_SO_LC68, propsFor([]))
    expect(container).toBeEmptyDOMElement()
  })

  it("mostra o rótulo e a data-base do documento que o registro citou", () => {
    renderWith(CORPUS_SO_LC68, propsFor(["lc68_0052_art_52"]))
    expect(screen.getByRole("note")).toHaveTextContent("Base legal LC 68/2024 atualizada em 22/07/2026")
  })

  it("W1/Onda 2: dossiê que citou a LC 68 NÃO migra para a LC 214 quando ela vira corrente", () => {
    // Este é o teste que autoriza a virada (PR 6). Antes da PR 2 o selo lia
    // o corpus ao vivo e passaria a afirmar "LC 214/2025" para um registro
    // cujas citações apontam chunks lc68_.
    renderWith(CORPUS_POS_VIRADA, propsFor(["lc68_0001_art_1"]))
    const nota = screen.getByRole("note")
    expect(nota).toHaveTextContent("Base legal LC 68/2024 atualizada em 22/07/2026")
    expect(nota).not.toHaveTextContent("LC 214/2025")
  })

  it("dossiê novo, gerado após a virada, cita a LC 214", () => {
    renderWith(CORPUS_POS_VIRADA, propsFor(["lc214_0010_art_10"]))
    expect(screen.getByRole("note")).toHaveTextContent("Base legal LC 214/2025 atualizada em 16/01/2026")
  })

  it("registro que citou os dois documentos nomeia ambos com suas datas", () => {
    renderWith(CORPUS_POS_VIRADA, propsFor(["lc68_0052_art_52", "lc214_0010_art_10"]))
    expect(screen.getByRole("note")).toHaveTextContent(
      "Base legal LC 68/2024 (22/07/2026) + LC 214/2025 (16/01/2026)",
    )
  })
})
