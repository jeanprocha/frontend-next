// Adapter puro entre a constante estática (lib/fiscal-law-changelog.ts) e o
// shape de LawCorpusResponse — fica em features/legal-corpus/ (não em lib/)
// porque a implementação do fallback é específica desta feature; o dado e os
// tipos ficam em lib/ (report-contract.ts já é o precedente: report→plg via
// CapabilityName, aqui é legal-corpus→fiscal-law-changelog via os mesmos tipos).
import { FISCAL_LAW_CHANGELOG, LC68_SOURCE_URL } from "@/lib/fiscal-law-changelog"
import type { FiscalLawChangelogPayload } from "@/lib/fiscal-law-changelog"
import type { LawCorpusResponse } from "@/lib/api/legal"

const FALLBACK_DOCUMENT_ID = "lc68-2024"

/** Devolve a constante FISCAL_LAW_CHANGELOG de sempre, no shape de LawCorpusResponse. */
export function staticCorpusFallback(): LawCorpusResponse {
  return {
    documents: [
      {
        id: FALLBACK_DOCUMENT_ID,
        label: "LC 68/2024",
        version: FISCAL_LAW_CHANGELOG.version,
        published_at: FISCAL_LAW_CHANGELOG.date,
        source_url: LC68_SOURCE_URL,
        chunk_prefix: "lc68_",
      },
    ],
    current_document_id: FALLBACK_DOCUMENT_ID,
    changelog: FISCAL_LAW_CHANGELOG.updates,
  }
}

/** Converte um LawCorpusResponse (real ou fallback) para o payload que ChangelogFiscalPanel já consome. */
export function corpusToChangelogPayload(corpus: LawCorpusResponse): FiscalLawChangelogPayload {
  const doc = corpus.documents.find((d) => d.id === corpus.current_document_id) ?? corpus.documents[0]
  return {
    version: doc?.version ?? FISCAL_LAW_CHANGELOG.version,
    date: doc?.published_at ?? FISCAL_LAW_CHANGELOG.date,
    updates: corpus.changelog,
  }
}
