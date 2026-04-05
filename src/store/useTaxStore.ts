import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  FormService,
  FormExpense,
  ClassificationItem,
  SimulationResponse,
} from "@/types/api"

// ─── Tipos internos do store ─────────────────────────────────────────────────

// Resultado de uma simulação via formulário manual — é o único modo que persiste,
// pois o CSV é sempre efêmero (depende de um arquivo local do usuário).
export interface PersistedResults {
  mode: "form"
  simulation: SimulationResponse
  classifications: ClassificationItem[]
  expenses: FormExpense[]
}

interface TaxState {
  // ── Dados do formulário (persistidos) ──────────────────────────────────
  year: number
  companyContext: string
  services: FormService[]
  expenses: FormExpense[]

  // ── Resultado da última simulação (persistido) ──────────────────────────
  results: PersistedResults | null

  // ── Actions ─────────────────────────────────────────────────────────────
  setYear: (year: number) => void
  setCompanyContext: (ctx: string) => void
  setServices: (services: FormService[]) => void
  setExpenses: (expenses: FormExpense[]) => void
  setResults: (r: PersistedResults | null) => void
  reset: () => void
}

// ─── Valores padrão (mesmos defaults usados antes no useState) ───────────────

const DEFAULTS = {
  year: 2026,
  companyContext:
    "Empresa SaaS B2B, regime regular IBS/CBS, fornecimento de software como serviço",
  services: [] as FormService[],
  expenses: [] as FormExpense[],
  results: null as PersistedResults | null,
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTaxStore = create<TaxState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setYear: (year) => set({ year }),
      setCompanyContext: (companyContext) => set({ companyContext }),
      setServices: (services) => set({ services }),
      setExpenses: (expenses) => set({ expenses }),
      setResults: (results) => set({ results }),

      // Reset limpa formulário E resultado, voltando aos defaults.
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: "tribia-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
