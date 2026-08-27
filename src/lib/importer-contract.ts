// Contrato de importers plugáveis (FE-3, PR 3c) — mesmo racional de
// report-contract.ts: features/import implementa, features/simulation
// renderiza as entries via render-prop, app/ compõe. Só importa types/api e
// tipos de React — nunca features/ (regra de fronteira, camada base).
import type { ComponentType, ReactNode } from "react"
import type { FormExpense, FormService } from "@/types/api"

/**
 * Rascunho de entrada produzido por um importer. Campos presentes
 * SUBSTITUEM o valor correspondente no useTaxStore (ver apply-draft.ts);
 * campos ausentes ficam intactos. O usuário completa o formulário e simula
 * pelo caminho único da máquina — nenhum importer chama a máquina direto.
 */
export interface SimulationDraft {
  services?: FormService[]
  expenses?: FormExpense[]
  companyContext?: string
  year?: number
}

export type ImporterParseResult =
  | { ok: true; draft: SimulationDraft; warnings?: string[] }
  | { ok: false; error: string }

export interface ImporterPickerProps {
  onApplied(summary: ImportAppliedSummary): void
}

export interface ImporterDefinition {
  /** "csv" | futuros "xml-nfe" | "sped". */
  id: string
  /** Rótulo no seletor de modo de entrada do dashboard. */
  label: string
  /** Extensões/mime do accept do <input type="file">. */
  accepts: readonly string[]
  /** Dica de formato exibida na zona de upload (ex.: "descricao,valor"). */
  formatHint?: string
  /** Parse PURO de conteúdo textual → rascunho. Testável no projeto node, sem DOM. */
  parse(content: string, opts?: { fileName?: string }): ImporterParseResult | Promise<ImporterParseResult>
  /** Opcional: UI própria (ex.: XML NF-e com drag-and-drop de pasta). Ausente = zona de upload genérica. */
  Picker?: ComponentType<ImporterPickerProps>
}

export interface ImportAppliedSummary {
  importerId: string
  fileName: string | null
  servicesCount: number
  expensesCount: number
}

/** Entry pronta para o painel de entrada — o dashboard só renderiza, nunca importa features/import. */
export interface ImporterPanelEntry {
  id: string
  label: string
  render(props: ImporterPickerProps): ReactNode
}
