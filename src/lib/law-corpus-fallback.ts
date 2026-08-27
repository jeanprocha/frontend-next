// Adapter puro entre a constante estática (lib/fiscal-law-changelog.ts) e o
// shape de LawCorpusResponse. Vive em lib/ (promovido de features/legal-corpus/
// na PR 10) porque deixou de ser consumo exclusivo dessa feature: useLawCorpus
// (lib/use-law-corpus.ts) precisa ficar acessível a qualquer feature que cite
// o corpus legal — regra de dependência do projeto proíbe feature→feature.
import { FISCAL_LAW_CHANGELOG, LAW_SOURCE_URL } from "@/lib/fiscal-law-changelog"
import type { FiscalLawChangelogPayload } from "@/lib/fiscal-law-changelog"
import type { LawCorpusResponse } from "@/lib/api/legal"

const FALLBACK_DOCUMENT_ID = "lc68-2024"

/** Devolve a constante FISCAL_LAW_CHANGELOG de sempre, no shape de LawCorpusResponse. */
export function staticCorpusFallback(): LawCorpusResponse {
  return {
    documents: [
      {
        id: FALLBACK_DOCUMENT_ID,
        label: FISCAL_LAW_CHANGELOG.label,
        version: FISCAL_LAW_CHANGELOG.version,
        published_at: FISCAL_LAW_CHANGELOG.date,
        source_url: LAW_SOURCE_URL,
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
    label: doc?.label ?? FISCAL_LAW_CHANGELOG.label,
    sourceUrl: doc?.source_url ?? FISCAL_LAW_CHANGELOG.sourceUrl,
    updates: corpus.changelog,
  }
}
