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
  /**
   * Etapa N/PR 7 (fato 9) — mensagem de validação do submit, compartilhada
   * entre o clique em "Simular" (dentro de SimulationForm) e o atalho ⌘Enter
   * (fora dela, em simulation-dashboard.tsx) — os dois chamam
   * `validateSimulationLines` e gravam o resultado aqui, porque só o form
   * tem onde renderizar a mensagem perto do campo. Some sozinha na próxima
   * edição de serviços/despesas (ver setServices/setExpenses).
   */
  submitValidationError: string | null
  /** ids das linhas (serviço e/ou despesa) com valor inválido — realce na linha certa. */
  invalidLineIds: string[]

  setYear: (year: number) => void
  setCompanyContext: (ctx: string) => void
  setCompanyRegime: (r: CompanyRegimeOption) => void
  setImobiliarioRedutorAjusteBrl: (v: string) => void
  setServices: (services: FormService[]) => void
  setExpenses: (expenses: FormExpense[]) => void
  setStrategyTagsDiscoveryMessage: (msg: string | null) => void
  appendStrategyTagHighlightPatterns: (patterns: string[]) => void
  clearStrategyTagsDiscoveryUi: () => void
  setSubmitValidationError: (message: string, invalidLineIds: string[]) => void
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
   * Semeia o rascunho do formulário a partir do cliente da URL
   * (/clientes/[companyId], FE-4). LIMPA expenses/companyRegime/year/redutor
   * — evita vazamento de contexto entre clientes. Sem tick de propagação:
   * quem monta o workspace chama pipeline.actions.clearResults()
   * explicitamente após semear — a identidade do cliente vive só na URL,
   * nunca neste store.
   */
  aplicarContextoDoCliente: (company: CompanyTemplate) => void
}

// ─── Valores padrão ───────────────────────────────────────────────────────────

const DEFAULTS = {
  year: 2026,
  // Etapa N/PR 4 (fato 7): antes vinha pré-preenchido com um exemplo de SaaS
  // — quem não editasse rodava TODA simulação como se fosse essa empresa,
  // silenciosamente, e esse texto ia para o prompt da IA. O placeholder do
  // campo (context-hub.tsx) já orienta; o cenário de exemplo (demo-scenarios.ts)
  // é o caminho para quem só quer testar sem digitar nada.
  companyContext: "",
  companyRegime: "regular" as CompanyRegimeOption,
  imobiliarioRedutorAjusteBrl: "",
  services: [] as FormService[],
  expenses: [] as FormExpense[],
  presentationMode: false,
  strategyTagsDiscoveryMessage: null as string | null,
  strategyTagHighlightPatterns: [] as string[],
  submitValidationError: null as string | null,
  invalidLineIds: [] as string[],
  analystBriefingOpen: false,
  analystBriefingKind: null as "chip" | "macro" | null,
  analystBriefingTag: null as StrategyTag | null,
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
  // Qualquer edição de linha invalida a mensagem de validação anterior — evita
  // banner "preso" apontando pra uma linha que o usuário já corrigiu.
  setServices: (services) => set({ services, submitValidationError: null, invalidLineIds: [] }),
  setExpenses: (expenses) => set({ expenses, submitValidationError: null, invalidLineIds: [] }),
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

  setSubmitValidationError: (message, invalidLineIds) =>
    set({ submitValidationError: message, invalidLineIds }),

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

  aplicarContextoDoCliente: (company) =>
    set({
      companyContext: company.tax_context ?? "",
      services: (company.default_services ?? []).map((sv) => ({
        id: crypto.randomUUID(),
        description: sv.description ?? "",
        amount: sv.amount ?? "",
        iss_rate: sv.iss_rate ?? "0.05",
      })),
      expenses: [],
      companyRegime: "regular",
      year: 2026,
      imobiliarioRedutorAjusteBrl: "",
      analystBriefingOpen: false,
      analystBriefingKind: null,
      analystBriefingTag: null,
      analystBriefingAiMeta: null,
      contextHighlightRuneRange: null,
      submitValidationError: null,
      invalidLineIds: [],
    }),
}))
