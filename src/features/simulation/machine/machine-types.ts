import type { QueryClient } from "@tanstack/react-query"
import type {
  AiMetadata,
  ClassificationItem,
  ConsultantClassificationOverride,
  FormExpense,
  FormService,
  SimulationResponse,
  StrategyTag,
} from "@/types/api"
import type { PersistedResults } from "@/lib/persisted-results"
import type { CompanyRegimeOption } from "@/lib/company-regime"

/** Resultado de simulação form — a única forma que a máquina possui. */
export type FormResults = Extract<PersistedResults, { mode: "form" }>

export interface SimulationInput {
  year: number
  services: FormService[]
  expenses: FormExpense[]
  companyContext: string
  companyRegime: CompanyRegimeOption
  imobiliarioRedutorAjusteBrl?: string
  /** Cliente da carteira (FE-4/W9) — ver ResultMeta.companyId em lib/persisted-results.ts. */
  companyId?: string
  /**
   * Etapa N/PR 9 (fato 12) — capturada no momento de simular, não só no
   * momento de abrir o dossiê: o persist "initial" roda automaticamente
   * assim que os resultados ficam prontos (STEP_SUCCEEDED), tipicamente bem
   * antes do usuário clicar em "Gerar Dossiê". Sem isso aqui, `openDossier`
   * só anexa a marca quando `meta.recordId` ainda não existe — na prática,
   * quase nunca (o persist automático já rodou) — e não há endpoint de
   * atualização no backend para corrigir depois. Ver ReportBrand abaixo.
   */
  reportBrand?: ReportBrand | null
}

export interface ClassifiedInput {
  serviceClassifications: ClassificationItem[]
  expenseClassifications: ClassificationItem[]
  discoveredTags: StrategyTag[]
  aiMetadata: AiMetadata | null
}

export type ReportBrand = { logo_url?: string | null; org_name?: string | null }

/** Contexto de I/O de um passo — resolvido tardiamente via `getStepCtx()` (runtime.ts). */
export interface StepCtx {
  getToken(): Promise<string | null>
  userId: string | null | undefined
  plan: string
  queryClient: QueryClient
}

export type StepId = string

/** Estágio de UI que o passo representa enquanto roda (ver use-pipeline-stage, PR 3d). */
export type PipelineUiStage = "context" | "classification" | "simulation" | "verdict"

/**
 * Acumulador explícito entre passos do registry (FE-3, PR 3b) — substitui o
 * canal implícito que existia em runtime.ts (setLastDiscoveredTags). Cada
 * passo recebe o acc do anterior e devolve o seu; um passo que não contribui
 * dados só repassa o acc recebido. `results` é obrigatório no acc devolvido
 * pelo ÚLTIMO passo do registry — é o que a máquina usa para transitar a `ready`.
 */
export interface PipelineAcc {
  classified?: ClassifiedInput
  discoveredTags?: StrategyTag[]
  results?: FormResults
}

export type StepOutcome = { ok: true; acc: PipelineAcc } | { ok: false; error: unknown }

/** Um passo do pipeline (FE-3, PR 3b) — ver `step-registry.ts` para a lista canónica. */
export interface Step {
  id: StepId
  uiStage: PipelineUiStage
  run(input: SimulationInput, acc: PipelineAcc, ctx: StepCtx): Promise<StepOutcome>
}

export type PipelineFailure = { step: StepId; error: unknown }

export type RecalcStatus = "idle" | "debouncing" | "in-flight"

/**
 * O que o persist que falhou usava para montar o payload — PERSIST_RETRY_REQUESTED
 * reemite exatamente isto. Sem isto o retry teria que "adivinhar" a origem: um
 * retry hardcoded em "initial" reprocessaria a elegibilidade bruta da IA e
 * descartaria em silêncio um override de consultor num persist de origem
 * "recalc" que tenha falhado (useInitialExpenseEligibility, ver build-record-payload.ts).
 */
export interface PersistRetryInfo {
  origin: PersistOrigin
  discoveredTags?: StrategyTag[]
  reportBrand?: ReportBrand | null
}

export interface ReadySync {
  pendingSync: boolean
  recalc: RecalcStatus
  /** Corrigido na Etapa M/PR 8 — agora exposto via use-simulation-pipeline. */
  lastRecalcError: unknown | null
  /** Idem — falha ao salvar (origem initial/recalc/dossier), antes NO_OP silencioso. */
  lastPersistError: unknown | null
  /** Dados do persist que falhou, para PERSIST_RETRY_REQUESTED reemitir a origem certa. */
  lastPersistRetry: PersistRetryInfo | null
}

export type MachineState =
  | { status: "idle"; failure: PipelineFailure | null }
  | { status: "running"; stepId: StepId; input: SimulationInput; acc: PipelineAcc }
  | { status: "ready"; results: FormResults; sync: ReadySync; dossierBusy: boolean }

export type MachineEvent =
  | { type: "RUN_REQUESTED"; input: SimulationInput }
  | { type: "STEP_SUCCEEDED"; stepId: StepId; acc: PipelineAcc }
  | { type: "STEP_FAILED"; stepId: StepId; error: unknown }
  | { type: "PERSIST_SUCCEEDED"; recordId: string }
  | { type: "PERSIST_FAILED"; error: unknown; origin: PersistOrigin; extra: { discoveredTags?: StrategyTag[]; reportBrand?: ReportBrand | null } }
  | { type: "OVERRIDE_APPLIED"; clientId: string; override: ConsultantClassificationOverride }
  | { type: "OVERRIDE_REMOVED"; clientId: string }
  | { type: "OVERRIDES_CLEARED" }
  | { type: "RECALC_REQUESTED" }
  | { type: "RECALC_DEBOUNCE_FIRED" }
  | { type: "RECALC_SUCCEEDED"; simulation: SimulationResponse }
  | { type: "RECALC_FAILED"; error: unknown }
  | { type: "DOSSIER_STARTED" }
  | { type: "DOSSIER_FINISHED" }
  /** Retry manual após PERSIST_FAILED (Etapa M/PR 8) — reemite a mesma origem que falhou (lastPersistRetry). */
  | { type: "PERSIST_RETRY_REQUESTED" }
  | { type: "HYDRATED"; results: FormResults }
  | { type: "RESULTS_CLEARED" }
  | { type: "RESET" }

export type OverrideEvent = Extract<
  MachineEvent,
  { type: "OVERRIDE_APPLIED" | "OVERRIDE_REMOVED" | "OVERRIDES_CLEARED" }
>

export type PersistOrigin = "initial" | "recalc" | "dossier"

export type Command =
  | { kind: "runStep"; stepId: StepId; input: SimulationInput; acc: PipelineAcc }
  | { kind: "recalc" }
  | { kind: "persist"; origin: PersistOrigin; discoveredTags?: StrategyTag[]; reportBrand?: ReportBrand | null }
  | { kind: "armRecalcDebounce" }
  | { kind: "cancelRecalcDebounce" }

export interface MachineEnv {
  /** Lido do useTaxStore no momento do dispatch (features→store: permitido). */
  presentationMode: boolean
  /** Registry injetável — testes usam registries fake para provar genericidade (PR 3b). */
  steps: readonly Step[]
}

export interface TransitionResult {
  state: MachineState
  commands: Command[]
}
