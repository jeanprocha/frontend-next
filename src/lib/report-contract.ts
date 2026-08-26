// Contrato do dossié (FE-2 PR 2c) — importa só types/api, os tipos de
// lib/tribia-plg-flags e lib/company-regime. Camada base (lib/), não pode
// importar de components/features/app (regra 1 do lint de fronteira); por
// isso o renderer real vive em features/report/, não aqui.
import type { ComponentType, ReactNode } from "react"
import type {
  AiMetadata,
  ClassificationItem,
  ConsultantClassificationOverride,
  FormExpense,
  FormService,
  ReportBrandSnapshot,
  SimulationResponse,
} from "@/types/api"
import type { CapabilityName } from "@/lib/tribia-plg-flags"
import type { CompanyRegimeOption } from "@/lib/company-regime"

export interface SimulationRecordMeta {
  createdAt: string
  companyContext: string
  year: number
  recordId?: string
}

/** Dados de uma simulação prontos para o dossié — independentes de como foram obtidos (form ao vivo ou histórico/público). */
export interface SimulationRecord {
  simulation: SimulationResponse
  classifications: ClassificationItem[]
  /** regime_type por serviço — ausente em registos antigos. */
  serviceClassifications?: ClassificationItem[]
  expenses: FormExpense[]
  services: FormService[]
  aiMetadata?: AiMetadata | null
  meta?: SimulationRecordMeta
  reportBrand?: ReportBrandSnapshot | null
  companyRegime?: CompanyRegimeOption
}

/**
 * screen-tabs: dashboard logado, fora do Board-Ready — monta só a secção da
 * aba activa. board: dashboard logado em modo apresentação — monta tudo.
 * public-linear: /report/[id] — monta tudo, sem tabs.
 */
export type ReportRenderMode = "screen-tabs" | "board" | "public-linear"

/**
 * always: participa do fluxo normal de impressão. board-only: só monta em
 * mode === "board", CSS `board-ready:* print:hidden` (fora do papel).
 * print-only: sempre montada, CSS `hidden print:*` (só visível ao imprimir).
 * never: nunca aparece na impressão (chrome interactivo).
 */
export type ReportPrintMode = "always" | "board-only" | "print-only" | "never"

export type ReportScreenTab = "veredito" | "cronograma" | "dossie" | "mesa"

export interface ReportOverrideActions {
  onApplyOverride?: (clientId: string, override: ConsultantClassificationOverride) => void
  onRemoveOverride?: (clientId: string) => void
  onRequestRecalc?: () => void
  pendingSimulationSync?: boolean
  isRecalculating?: boolean
}

export interface ReportComparison {
  baseline: SimulationRecord
  onAdjustParams?: () => void
  onCancel?: () => void
  onUseCurrentAsBaseline?: () => void
}

export interface ReportSectionProps {
  record: SimulationRecord
  mode: ReportRenderMode
  focusYear: number
  onFocusYearChange?: (year: number) => void
  overrides?: ReportOverrideActions
  comparison?: ReportComparison
  /** Rótulo curto de empresa derivado do contexto (masthead de impressão, carimbo de sessão). */
  sessionCompanyLabel?: string
  sessionScenarioLabel?: string
  /** screen-tabs: muda a aba activa (chama scrollIntoView a seguir). Ausente em board/public-linear — tudo já está montado. */
  onNavigateToTab?: (tab: ReportScreenTab) => void
}

export interface ReportSection {
  id: string
  title: string
  /** Capacidade PLG que a secção exige; ausente = sempre visível (sujeito só a print/screenTab). */
  capability?: CapabilityName
  print: ReportPrintMode
  /** Aba do screen-tabs a que pertence — irrelevante fora desse modo. */
  screenTab?: ReportScreenTab
  Component: ComponentType<ReportSectionProps>
}

export interface ReportSlots {
  /** CTA de dossié (Partilhar relatório), junto ao carimbo de sessão. */
  dossierCta?: ReactNode
  headerBanners?: ReactNode
  /** Conteúdo à direita da linha Empresa / Cenário (ex.: «Simulação do histórico»). */
  sessionStampAside?: ReactNode
}

export interface ReportRenderInput {
  record: SimulationRecord
  sections: ReportSection[]
  mode: ReportRenderMode
  focusYear: number
  onFocusYearChange?: (year: number) => void
  overrides?: ReportOverrideActions
  comparison?: ReportComparison
  slots?: ReportSlots
  sessionCompanyLabel?: string
  sessionScenarioLabel?: string
}
