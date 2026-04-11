import { create } from "zustand"
import type {
  AiMetadata,
  CompanyTemplate,
  ConsultantClassificationOverride,
  FormService,
  FormExpense,
  ClassificationItem,
  SimulationRecordDetailResponse,
  SimulationResponse,
  StrategyTag,
} from "@/types/api"
import { findNormalizedPatternRuneSpan } from "@/lib/context-rune-span"

// ─── Tipos internos do store ─────────────────────────────────────────────────

export interface ResultMeta {
  createdAt: string
  companyContext: string
  year: number
}

export interface PersistedResults {
  mode: "form"
  simulation: SimulationResponse
  classifications: ClassificationItem[]
  expenses: FormExpense[]
  meta?: ResultMeta
  /** Agregado RAG (serviços + despesas); omitido em registos antigos / sem evidências. */
  ai_metadata?: AiMetadata | null
  /**
   * Classificações dos serviços (regime_type por serviço) — pré-requisito para
   * recalcular a simulação após override sem novo batch de classificação IA.
   * Ausente em registos antigos; fallback "padrao" no recálculo.
   */
  service_classifications?: ClassificationItem[]
}

export type CompanyRegimeOption =
  | "regular"
  | "mei"
  | "simples_puro"
  | "simples_hibrido"
  | "diferenciado_60"
  | "aliquota_zero"
  | "exportadora"
  | "entidade_imune"
  | "imobiliario_venda"
  | "imobiliario_aluguel"
  | "prof_liberal"

export function isImobiliarioRegime(r: CompanyRegimeOption): boolean {
  return r === "imobiliario_venda" || r === "imobiliario_aluguel"
}

interface TaxState {
  year: number
  companyContext: string
  companyRegime: CompanyRegimeOption
  /** Redutor de base (R$) para perfis imobiliários; vazio = backend usa env ou 0 */
  imobiliarioRedutorAjusteBrl: string
  services: FormService[]
  expenses: FormExpense[]
  results: PersistedResults | null
  /**
   * Modo apresentação Board-Ready. Valor inicial sempre `false` (SSR-safe).
   * A hidratação a partir de `sessionStorage` é feita apenas no cliente, em
   * `useEffect` no hook `use-board-ready.ts`, com guardas de tier e resultado.
   */
  presentationMode: boolean
  setPresentationMode: (v: boolean) => void
  /**
   * Par A/B vindo do histórico: o dashboard consome uma vez e limpa.
   * baseline = referência A; current = cenário B (hidrata formulário + resultados).
   */
  pendingHistoryComparison: {
    baseline: SimulationRecordDetailResponse
    current: SimulationRecordDetailResponse
  } | null
  /** Mensagem após simulação quando a API gravou novas strategy_tags (chips). */
  strategyTagsDiscoveryMessage: string | null
  /** Padrões normalizados para realçar chips recém-inseridos na sessão. */
  strategyTagHighlightPatterns: string[]

  setYear: (year: number) => void
  setCompanyContext: (ctx: string) => void
  setCompanyRegime: (r: CompanyRegimeOption) => void
  setImobiliarioRedutorAjusteBrl: (v: string) => void
  setServices: (services: FormService[]) => void
  setExpenses: (expenses: FormExpense[]) => void
  setResults: (r: PersistedResults | null) => void
  setPendingHistoryComparison: (
    p: {
      baseline: SimulationRecordDetailResponse
      current: SimulationRecordDetailResponse
    } | null,
  ) => void
  setStrategyTagsDiscoveryMessage: (msg: string | null) => void
  appendStrategyTagHighlightPatterns: (patterns: string[]) => void
  clearStrategyTagsDiscoveryUi: () => void
  /** Briefing lateral (plano 06) + Raio-X no contexto. */
  analystBriefingOpen: boolean
  analystBriefingKind: "chip" | "macro" | null
  analystBriefingTag: StrategyTag | null
  /** Briefing agregado (gauge macro / plano 07). */
  analystBriefingAiMeta: AiMetadata | null
  contextHighlightRuneRange: { start: number; end: number } | null
  openAnalystBriefingFromChip: (tag: StrategyTag) => void
  openAnalystBriefingFromMacro: (meta: AiMetadata) => void
  /** Raio-X: matched_span da linha, sem abrir o sheet (Cédula «Ver lei» na tabela). */
  setContextHighlightFromClassification: (c: ClassificationItem | null) => void
  closeAnalystBriefing: () => void
  applyCompanyTemplate: (company: CompanyTemplate) => void
  reset: () => void

  // ── 3.4.1 / 3.4.2 Override manual + recálculo reactivo ──────────────────
  /**
   * Verdadeiro quando o conjunto de overrides não foi ainda reflectido no
   * `simulation` actual. Limpo após recálculo bem-sucedido via simulate-only.
   */
  pendingSimulationSync: boolean
  /**
   * Contador monotónico incrementado por cada apply/remove de override.
   * A RecalcBridge observa este valor (useEffect dep) para disparar o debounce
   * sem reagir a re-renders que não envolvam mudança real de classificação.
   * Nunca decresce — só cresce durante a sessão.
   */
  overrideRecalcTick: number
  /**
   * Aplica um override ao ClassificationItem identificado por clientId.
   * Merge imutável — nunca altera is_eligible/regime_type originais da IA.
   * Após aplicar, marca pendingSimulationSync = true e incrementa overrideRecalcTick.
   */
  applyExpenseClassificationOverride: (
    clientId: string,
    override: ConsultantClassificationOverride,
  ) => void
  /**
   * Remove override de uma linha (restaura sugestão IA).
   * Sempre marca pendingSimulationSync = true — o motor Go deve reflectir
   * o regresso à sugestão IA tanto quanto o avanço para override manual.
   * Incrementa overrideRecalcTick para disparar a RecalcBridge.
   */
  removeExpenseClassificationOverride: (clientId: string) => void
  /** Chamado pelo hook de recálculo após POST /simulations bem-sucedido. */
  markSimulationSynced: (newSimulation: SimulationResponse) => void
}

// ─── Valores padrão ───────────────────────────────────────────────────────────

const DEFAULTS = {
  year: 2026,
  companyContext:
    "Empresa SaaS B2B, regime regular IBS/CBS, fornecimento de software como serviço",
  companyRegime: "regular" as CompanyRegimeOption,
  imobiliarioRedutorAjusteBrl: "",
  services: [] as FormService[],
  expenses: [] as FormExpense[],
  results: null as PersistedResults | null,
  presentationMode: false,
  pendingHistoryComparison: null as {
    baseline: SimulationRecordDetailResponse
    current: SimulationRecordDetailResponse
  } | null,
  strategyTagsDiscoveryMessage: null as string | null,
  strategyTagHighlightPatterns: [] as string[],
  analystBriefingOpen: false,
  analystBriefingKind: null as "chip" | "macro" | null,
  analystBriefingTag: null as StrategyTag | null,
  analystBriefingAiMeta: null as AiMetadata | null,
  contextHighlightRuneRange: null as { start: number; end: number } | null,
  pendingSimulationSync: false,
  overrideRecalcTick: 0,
}

// ─── Store (sem persistência — estado vive apenas enquanto a aba está aberta) ──

export const useTaxStore = create<TaxState>()((set, get) => ({
  ...DEFAULTS,

  setYear: (year) => set({ year }),
  setCompanyContext: (companyContext) => set({ companyContext }),
  setCompanyRegime: (companyRegime) => set({ companyRegime }),
  setImobiliarioRedutorAjusteBrl: (imobiliarioRedutorAjusteBrl) => set({ imobiliarioRedutorAjusteBrl }),
  setServices: (services) => set({ services }),
  setExpenses: (expenses) => set({ expenses }),
  setResults: (results) => set({ results }),
  setPresentationMode: (presentationMode) => set({ presentationMode }),
  setPendingHistoryComparison: (pendingHistoryComparison) => set({ pendingHistoryComparison }),

  setStrategyTagsDiscoveryMessage: (strategyTagsDiscoveryMessage) => set({ strategyTagsDiscoveryMessage }),
  appendStrategyTagHighlightPatterns: (patterns) =>
    set((s) => ({
      strategyTagHighlightPatterns: [
        ...new Set([...s.strategyTagHighlightPatterns, ...patterns.filter(Boolean)]),
      ],
    })),
  clearStrategyTagsDiscoveryUi: () =>
    set({ strategyTagsDiscoveryMessage: null, strategyTagHighlightPatterns: [] }),

  openAnalystBriefingFromChip: (tag) => {
    const ctx = get().companyContext ?? ""
    const span = findNormalizedPatternRuneSpan(ctx, tag.pattern)
    set({
      analystBriefingOpen: true,
      analystBriefingKind: "chip",
      analystBriefingTag: tag,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: span,
    })
  },

  setContextHighlightFromClassification: (c) => {
    if (!c) {
      set({ contextHighlightRuneRange: null })
      return
    }
    const ms = c.matched_span
    let span: { start: number; end: number } | null = null
    if (ms && ms.end > ms.start && ms.start >= 0) {
      span = { start: ms.start, end: ms.end }
    }
    set({ contextHighlightRuneRange: span })
  },

  openAnalystBriefingFromMacro: (meta) =>
    set({
      analystBriefingOpen: true,
      analystBriefingKind: "macro",
      analystBriefingTag: null,
      analystBriefingAiMeta: meta,
      contextHighlightRuneRange: null,
    }),

  closeAnalystBriefing: () =>
    set({
      analystBriefingOpen: false,
      analystBriefingKind: null,
      analystBriefingTag: null,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: null,
    }),

  // Preenche contexto e serviços a partir de um template, forçando nova simulação.
  applyCompanyTemplate: (company) =>
    set({
      companyContext: company.tax_context ?? "",
      services: (company.default_services ?? []).map((s) => ({
        id: crypto.randomUUID(),
        description: s.description ?? "",
        amount: s.amount ?? "",
        iss_rate: s.iss_rate ?? "0.05",
      })),
      results: null,
      analystBriefingOpen: false,
      analystBriefingKind: null,
      analystBriefingTag: null,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: null,
    }),

  reset: () =>
    set({
      ...DEFAULTS,
      presentationMode: false,
      pendingHistoryComparison: null,
      strategyTagsDiscoveryMessage: null,
      strategyTagHighlightPatterns: [],
      analystBriefingOpen: false,
      analystBriefingKind: null,
      analystBriefingTag: null,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: null,
      pendingSimulationSync: false,
      overrideRecalcTick: 0,
    }),

  // ── 3.4.1 / 3.4.2 Override manual + trigger reactivo ────────────────────

  applyExpenseClassificationOverride: (clientId, override) => {
    const { results, overrideRecalcTick } = get()
    if (!results || results.mode !== "form") return
    const updated = results.classifications.map((c) => {
      const match =
        (c.client_id && c.client_id === clientId) ||
        (!c.client_id && c.description === clientId)
      if (!match) return c
      return { ...c, consultant_override: override }
    })
    set({
      results: { ...results, classifications: updated },
      pendingSimulationSync: true,
      overrideRecalcTick: overrideRecalcTick + 1,
    })
  },

  removeExpenseClassificationOverride: (clientId) => {
    const { results, overrideRecalcTick } = get()
    if (!results || results.mode !== "form") return
    const updated = results.classifications.map((c) => {
      const match =
        (c.client_id && c.client_id === clientId) ||
        (!c.client_id && c.description === clientId)
      if (!match) return c
      const { consultant_override: _removed, ...rest } = c
      return rest as ClassificationItem
    })
    // Sempre pendente após remoção: o motor Go deve reflectir o regresso à
    // sugestão IA — não é apenas "sem override = sem diferença".
    set({
      results: { ...results, classifications: updated },
      pendingSimulationSync: true,
      overrideRecalcTick: overrideRecalcTick + 1,
    })
  },

  markSimulationSynced: (newSimulation) => {
    const { results } = get()
    if (!results || results.mode !== "form") return
    set({
      results: { ...results, simulation: newSimulation },
      pendingSimulationSync: false,
    })
  },
}))
