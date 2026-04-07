import { create } from "zustand"
import type {
  AiMetadata,
  CompanyTemplate,
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
  analystBriefingKind: "chip" | "classification" | "macro" | null
  analystBriefingTag: StrategyTag | null
  analystBriefingClassification: ClassificationItem | null
  /** Briefing agregado (gauge macro / plano 07). */
  analystBriefingAiMeta: AiMetadata | null
  contextHighlightRuneRange: { start: number; end: number } | null
  openAnalystBriefingFromChip: (tag: StrategyTag) => void
  openAnalystBriefingFromClassification: (c: ClassificationItem) => void
  openAnalystBriefingFromMacro: (meta: AiMetadata) => void
  closeAnalystBriefing: () => void
  applyCompanyTemplate: (company: CompanyTemplate) => void
  reset: () => void
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
  pendingHistoryComparison: null as {
    baseline: SimulationRecordDetailResponse
    current: SimulationRecordDetailResponse
  } | null,
  strategyTagsDiscoveryMessage: null as string | null,
  strategyTagHighlightPatterns: [] as string[],
  analystBriefingOpen: false,
  analystBriefingKind: null as "chip" | "classification" | "macro" | null,
  analystBriefingTag: null as StrategyTag | null,
  analystBriefingClassification: null as ClassificationItem | null,
  analystBriefingAiMeta: null as AiMetadata | null,
  contextHighlightRuneRange: null as { start: number; end: number } | null,
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
      analystBriefingClassification: null,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: span,
    })
  },

  openAnalystBriefingFromClassification: (c) => {
    let span: { start: number; end: number } | null = null
    const ms = c.matched_span
    if (ms && ms.end > ms.start && ms.start >= 0) {
      span = { start: ms.start, end: ms.end }
    }
    set({
      analystBriefingOpen: true,
      analystBriefingKind: "classification",
      analystBriefingTag: null,
      analystBriefingClassification: c,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: span,
    })
  },

  openAnalystBriefingFromMacro: (meta) =>
    set({
      analystBriefingOpen: true,
      analystBriefingKind: "macro",
      analystBriefingTag: null,
      analystBriefingClassification: null,
      analystBriefingAiMeta: meta,
      contextHighlightRuneRange: null,
    }),

  closeAnalystBriefing: () =>
    set({
      analystBriefingOpen: false,
      analystBriefingKind: null,
      analystBriefingTag: null,
      analystBriefingClassification: null,
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
      analystBriefingClassification: null,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: null,
    }),

  reset: () =>
    set({
      ...DEFAULTS,
      pendingHistoryComparison: null,
      strategyTagsDiscoveryMessage: null,
      strategyTagHighlightPatterns: [],
      analystBriefingOpen: false,
      analystBriefingKind: null,
      analystBriefingTag: null,
      analystBriefingClassification: null,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: null,
    }),
}))
