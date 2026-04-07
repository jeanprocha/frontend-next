export type FiscalChangelogEntryType = "rule" | "ia"

export interface FiscalChangelogEntry {
  type: FiscalChangelogEntryType
  label: string
  desc: string
}

export interface FiscalLawChangelogPayload {
  version: string
  date: string
  updates: FiscalChangelogEntry[]
}

/** Texto oficial no Planalto (changelog UI e landing). */
export const LC68_SOURCE_URL =
  "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp68.htm" as const

/**
 * Fonte estática até existir API de versão do motor. Atualizar com releases reais.
 * Alterações que impliquem interpretação legal devem ser validadas pelo domínio antes de publicar.
 */
export const FISCAL_LAW_CHANGELOG: FiscalLawChangelogPayload = {
  version: "2.1",
  date: "2026-04-05",
  updates: [
    {
      type: "rule",
      label: "Créditos SaaS (CBS)",
      desc: "Parâmetros de simulação para licenciamento de software foram alinhados às premissas do motor; revisite cenários antigos se usar esta faixa.",
    },
    {
      type: "ia",
      label: "Motor RAG — despesas cloud",
      desc: "Prompts e recuperação de trechos LC 68/2024 para custos de infraestrutura em nuvem; classificações antigas podem mudar ligeiramente ao reexecutar.",
    },
  ],
}

/** Rótulo para rodapé de relatório / racional executivo (Plano 10). */
export function fiscalLawVersionLabel(version: string = FISCAL_LAW_CHANGELOG.version): string {
  return `LC 68/2024 v${version}`
}
