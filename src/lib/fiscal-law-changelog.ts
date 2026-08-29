export type FiscalChangelogEntryType = "rule" | "ia"

export interface FiscalChangelogEntry {
  type: FiscalChangelogEntryType
  label: string
  desc: string
}

export interface FiscalLawChangelogPayload {
  version: string
  date: string
  /** Rótulo do documento (ex.: "LC 68/2024") — vem do corpus real quando isLive (ver useLawCorpus). */
  label: string
  /** URL da fonte oficial do documento — idem. */
  sourceUrl: string
  updates: FiscalChangelogEntry[]
}

/**
 * Fonte oficial do documento corrente — o texto compilado da LC 214/2025 no
 * Planalto (inclui as alterações da LC 227/2026, que é o que está ingerido
 * desde a Onda 2/PR 5).
 *
 * Até a virada da Onda 2/PR 6 isto apontava a página de tramitação do
 * PLP 68/2024 na Câmara — deliberadamente a Câmara e não o Planalto, porque o
 * PLP nunca virou "LC 68": esse número já é de uma lei complementar de 1991,
 * sem relação com a reforma tributária.
 *
 * A URL por documento vem do backend em `GET /law/corpus`
 * (internal/lawcorpus/catalog.go); esta constante só alimenta o fallback
 * estático, usado quando a API não responde.
 */
export const LAW_SOURCE_URL = "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm" as const

/**
 * Fallback estático — só aparece quando `GET /law/corpus` não responde
 * (`useLawCorpus().isLive === false`). Precisa espelhar o documento CORRENTE do
 * backend, senão a UI diz uma lei na falha e outra no caminho feliz.
 *
 * `date` é a data-base do TEXTO ingerido, não a da publicação original da lei:
 * o corpus é o compilado, já com as alterações da LC 227/2026, e é isso que o
 * backend reporta em `published_at`. Virado junto com
 * LAW_CORPUS_CURRENT_SOURCE no Railway (Onda 2/PR 6) — os dois lados mudam na
 * mesma leva, por isso.
 */
export const FISCAL_LAW_CHANGELOG: FiscalLawChangelogPayload = {
  version: "1",
  date: "2026-06-16",
  label: "LC 214/2025",
  sourceUrl: LAW_SOURCE_URL,
  // Vazio de propósito. O changelog real é FATO DE INDEXAÇÃO servido por
  // `GET /law/corpus` ("N trechos, data-base DD/MM/AAAA"), e o fallback não tem
  // como saber o que está ingerido. Até 28/08/2026 havia aqui duas entradas
  // inventadas ("Créditos SaaS (CBS)", "Motor RAG — despesas cloud") que
  // descreviam mudanças de regra que nunca existiram — fabricação dentro do
  // produto, contra o princípio 4 do PRODUCT.md. Sem servidor, a UI declara a
  // ausência (ver ChangelogFiscalPanel) em vez de inventar histórico.
  updates: [],
}

/** Rótulo para rodapé de relatório / racional executivo (Plano 10). */
export function fiscalLawVersionLabel(
  version: string = FISCAL_LAW_CHANGELOG.version,
  label: string = FISCAL_LAW_CHANGELOG.label,
): string {
  return `${label} v${version}`
}
