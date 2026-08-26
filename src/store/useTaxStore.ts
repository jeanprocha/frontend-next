import { create } from "zustand"
import type {
  AiMetadata,
  ClassificationItem,
  CompanyTemplate,
  FormService,
  FormExpense,
  StrategyTag,
} from "@/types/api"
import { findNormalizedPatternRuneSpan } from "@/lib/context-rune-span"
import type { CompanyRegimeOption } from "@/lib/company-regime"

interface TaxState {
  year: number
  companyContext: string
  companyRegime: CompanyRegimeOption
  /** Redutor de base (R$) para perfis imobiliários; vazio = backend usa env ou 0 */
  imobiliarioRedutorAjusteBrl: string
  services: FormService[]
  expenses: FormExpense[]
  /**
   * Modo apresentação Board-Ready. Valor inicial sempre `false` (SSR-safe).
   * A hidratação a partir de `sessionStorage` é feita apenas no cliente, em
   * `useEffect` no hook `use-board-ready.ts`, com guardas de tier e resultado.
   */
  presentationMode: boolean
  setPresentationMode: (v: boolean) => void
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
  /**
   * Preenche contexto e serviços a partir de um template. `templateApplyTick`
   * é o único canal store→máquina (FE-1): features/simulation/machine
   * assina este contador via subscribe() e despacha RESULTS_CLEARED quando
   * ele muda — o template é aplicado a partir de components/ (CommandMenu),
   * que não pode importar a feature (lint de fronteira).
   */
  applyCompanyTemplate: (company: CompanyTemplate) => void
  templateApplyTick: number
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
  presentationMode: false,
  strategyTagsDiscoveryMessage: null as string | null,
  strategyTagHighlightPatterns: [] as string[],
  analystBriefingOpen: false,
  analystBriefingKind: null as "chip" | "macro" | null,
  analystBriefingTag: null as StrategyTag | null,
  analystBriefingAiMeta: null as AiMetadata | null,
  contextHighlightRuneRange: null as { start: number; end: number } | null,
  templateApplyTick: 0,
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
  setPresentationMode: (presentationMode) => set({ presentationMode }),

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
    set((s) => ({
      companyContext: company.tax_context ?? "",
      services: (company.default_services ?? []).map((sv) => ({
        id: crypto.randomUUID(),
        description: sv.description ?? "",
        amount: sv.amount ?? "",
        iss_rate: sv.iss_rate ?? "0.05",
      })),
      templateApplyTick: s.templateApplyTick + 1,
      analystBriefingOpen: false,
      analystBriefingKind: null,
      analystBriefingTag: null,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: null,
    })),
}))
