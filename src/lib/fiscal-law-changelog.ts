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
 * Fonte oficial do documento hoje ingerido (PLP 68/2024, pré-sanção) — página
 * de tramitação na Câmara, NÃO o Planalto: o PLP nunca virou "LC 68" — esse
 * número já é de uma lei complementar de 1991, sem nenhuma relação com a
 * reforma tributária (confirmado; a URL antiga desta constante apontava para
 * ela por engano). Quando GET /law/corpus estiver ativo (PR 8), a URL certa
 * por documento vem do backend (internal/lawcorpus/catalog.go) — esta
 * constante só alimenta o fallback estático.
 */
export const LAW_SOURCE_URL =
  "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2430143" as const

/**
 * Fonte estática até existir API de versão do motor. Atualizar com releases reais.
 * Alterações que impliquem interpretação legal devem ser validadas pelo domínio antes de publicar.
 */
export const FISCAL_LAW_CHANGELOG: FiscalLawChangelogPayload = {
  version: "2.1",
  date: "2026-04-05",
  label: "LC 68/2024",
  sourceUrl: LAW_SOURCE_URL,
  updates: [
    {
      type: "rule",
      label: "Créditos SaaS (CBS)",
      desc: "Parâmetros de simulação para licenciamento de software foram alinhados às premissas do motor; revisite cenários antigos se usar esta faixa.",
    },
    {
      type: "ia",
      label: "Motor RAG — despesas cloud",
      desc: "Prompts e recuperação de trechos da lei para custos de infraestrutura em nuvem; classificações antigas podem mudar ligeiramente ao reexecutar.",
    },
  ],
}

/** Rótulo para rodapé de relatório / racional executivo (Plano 10). */
export function fiscalLawVersionLabel(
  version: string = FISCAL_LAW_CHANGELOG.version,
  label: string = FISCAL_LAW_CHANGELOG.label,
): string {
  return `${label} v${version}`
}
