import type {
  AiMetadata,
  ClassificationItem,
  ConsultantClassificationOverride,
  FormExpense,
  FormService,
  SimulationResponse,
  StrategyTag,
} from "@/types/api"
import type { PersistedResults } from "@/store/useTaxStore"
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
}

export interface ClassifiedInput {
  serviceClassifications: ClassificationItem[]
  expenseClassifications: ClassificationItem[]
  discoveredTags: StrategyTag[]
  aiMetadata: AiMetadata | null
}

export type PipelineFailure = { step: "classify" | "simulate"; error: unknown }

export type RecalcStatus = "idle" | "debouncing" | "in-flight"

export interface ReadySync {
  pendingSync: boolean
  recalc: RecalcStatus
  /** Bug preservado (FE-1): sem superfície de UI — não corrigido nesta fase. */
  lastRecalcError: unknown | null
}

export type MachineState =
  | { status: "idle"; failure: PipelineFailure | null }
  | { status: "classifying"; input: SimulationInput }
  | { status: "calculating"; input: SimulationInput; classified: ClassifiedInput }
  | { status: "ready"; results: FormResults; sync: ReadySync; dossierBusy: boolean }

export type MachineEvent =
  | { type: "RUN_REQUESTED"; input: SimulationInput }
  | { type: "CLASSIFY_SUCCEEDED"; classified: ClassifiedInput }
  | { type: "CLASSIFY_FAILED"; error: unknown }
  | { type: "SIMULATE_SUCCEEDED"; results: FormResults }
  | { type: "SIMULATE_FAILED"; error: unknown }
  | { type: "PERSIST_SUCCEEDED"; recordId: string }
  | { type: "PERSIST_FAILED"; error: unknown }
  | { type: "OVERRIDE_APPLIED"; clientId: string; override: ConsultantClassificationOverride }
  | { type: "OVERRIDE_REMOVED"; clientId: string }
  | { type: "OVERRIDES_CLEARED" }
  | { type: "RECALC_REQUESTED" }
  | { type: "RECALC_DEBOUNCE_FIRED" }
  | { type: "RECALC_SUCCEEDED"; simulation: SimulationResponse }
  | { type: "RECALC_FAILED"; error: unknown }
  | { type: "DOSSIER_STARTED" }
  | { type: "DOSSIER_FINISHED" }
  | { type: "HYDRATED"; results: FormResults }
  | { type: "RESULTS_CLEARED" }
  | { type: "RESET" }

export type OverrideEvent = Extract<
  MachineEvent,
  { type: "OVERRIDE_APPLIED" | "OVERRIDE_REMOVED" | "OVERRIDES_CLEARED" }
>

export type PersistOrigin = "initial" | "recalc" | "dossier"

export type Command =
  | { kind: "classify"; input: SimulationInput }
  | { kind: "simulate"; input: SimulationInput; classified: ClassifiedInput }
  | { kind: "recalc" }
  | { kind: "persist"; origin: PersistOrigin }
  | { kind: "armRecalcDebounce" }
  | { kind: "cancelRecalcDebounce" }

export interface MachineEnv {
  /** Lido do useTaxStore no momento do dispatch (features→store: permitido). */
  presentationMode: boolean
}

export interface TransitionResult {
  state: MachineState
  commands: Command[]
}
