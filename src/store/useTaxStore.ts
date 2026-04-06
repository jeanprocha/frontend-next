import { create } from "zustand"
import type {
  AiMetadata,
  CompanyTemplate,
  FormService,
  FormExpense,
  ClassificationItem,
  SimulationResponse,
} from "@/types/api"

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
  setStrategyTagsDiscoveryMessage: (msg: string | null) => void
  appendStrategyTagHighlightPatterns: (patterns: string[]) => void
  clearStrategyTagsDiscoveryUi: () => void
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
  strategyTagsDiscoveryMessage: null as string | null,
  strategyTagHighlightPatterns: [] as string[],
}

// ─── Store (sem persistência — estado vive apenas enquanto a aba está aberta) ──

export const useTaxStore = create<TaxState>()((set) => ({
  ...DEFAULTS,

  setYear: (year) => set({ year }),
  setCompanyContext: (companyContext) => set({ companyContext }),
  setCompanyRegime: (companyRegime) => set({ companyRegime }),
  setImobiliarioRedutorAjusteBrl: (imobiliarioRedutorAjusteBrl) => set({ imobiliarioRedutorAjusteBrl }),
  setServices: (services) => set({ services }),
  setExpenses: (expenses) => set({ expenses }),
  setResults: (results) => set({ results }),

  setStrategyTagsDiscoveryMessage: (strategyTagsDiscoveryMessage) => set({ strategyTagsDiscoveryMessage }),
  appendStrategyTagHighlightPatterns: (patterns) =>
    set((s) => ({
      strategyTagHighlightPatterns: [
        ...new Set([...s.strategyTagHighlightPatterns, ...patterns.filter(Boolean)]),
      ],
    })),
  clearStrategyTagsDiscoveryUi: () =>
    set({ strategyTagsDiscoveryMessage: null, strategyTagHighlightPatterns: [] }),

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
    }),

  reset: () =>
    set({
      ...DEFAULTS,
      strategyTagsDiscoveryMessage: null,
      strategyTagHighlightPatterns: [],
    }),
}))
