import type { MemoryExportMeta } from "@/lib/download-simulation-memory-csv"
import type { TransitionEsteiraUi } from "@/lib/transition-esteira-ui"
import type {
  AiMetadata,
  ClassificationItem,
  FormExpense,
  FormService,
  SimulationResponse,
} from "@/types/api"
/** Valores canónicos das abas — manter alinhado a `AUDIT_TRAIL_STEPS` e `audit-trail-journey`. */
export const ESTEIRA_TAB_VALUES = ["dados", "classificacao", "rag", "go"] as const

export type AuditTabValue = (typeof ESTEIRA_TAB_VALUES)[number]

/**
 * Índice em `AUDIT_TRAIL_STEPS` para o rótulo/descrição de cada aba. A jornada tem 5 passos; a
 * esteira tem 4 painéis — «Veredito executivo» não tem aba dedicada (cobre-se no contexto / hero).
 */
export const ESTEIRA_TAB_JOURNEY_INDEX: Record<AuditTabValue, number> = {
  dados: 0,
  classificacao: 4,
  rag: 3,
  go: 2,
}

/**
 * Dados e flags da Esteira de Confiança, agrupados para evitar prop drilling
 * entre o dashboard, `AuditConfidenceTabs` e orquestradores.
 */
export interface SimulationEsteiraProps {
  simulation: SimulationResponse
  services: FormService[]
  expenses: FormExpense[]
  companyContext: string
  classifications: ClassificationItem[]
  aiMetadata: AiMetadata | null | undefined
  focusYear: number
  seriesEnriched?: boolean
  showTransitionAuditFactors: boolean
  /** Modo apresentação / Board-Ready. */
  presentationMode?: boolean
  /** Gráfico de transição, Sankey e subpainéis — Tab Motor Go. */
  transitionUi: TransitionEsteiraUi
  /** Tab Anatomia — `SummaryCards` (comparativo + gráfico de barras). */
  summaryResult: SimulationResponse
  summaryCompareBaseline?: SimulationResponse
  summaryOverlapAnatomy: boolean
  summarySimulationRunYear?: number
  /** Quando o delta já está no Hero, suprimir o cartão de delta em anatomia. */
  summaryHideDeltaCard: boolean
  /** Sincronizar UI do gráfico de transição com o POST de recálculo. */
  isRecalculating?: boolean
  /** Simulação ainda desalinhada com overrides (antes do POST concluir). */
  pendingSimulationSync?: boolean
  /** Tab controlada (navegação a partir do veredito / hash). */
  esteiraTab?: AuditTabValue
  onEsteiraTabChange?: (tab: AuditTabValue) => void
  /** Dossié linear (Cronograma + RAG) sem bloco Anatomia. */
  publicLinear?: boolean
  /** Rótulo de sessão / empresa (export PRO — memória de cálculo CSV). */
  memoryExportLabel?: string
  /** Carimbo de sessão, ID de histórico, etc. (export PRO). */
  memoryExportMeta?: MemoryExportMeta
}
