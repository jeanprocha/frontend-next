// Movido de src/lib/build-simulation-record-payload.ts (FE-1) — só a máquina
// consome isto agora. Estendido com `discoveredTags`: o save inicial
// (use-simulation.ts) incluía discovered_tags no snapshot; sem esse
// parâmetro, unificar os três caminhos de persist (initial/recalc/dossier)
// num só helper perderia esse dado.
import type { SimulationRecordCreatePayload, StrategyTag } from "@/types/api"
import type { CompanyRegimeOption, PersistedResults } from "@/store/useTaxStore"
import { getEffectiveExpenseSimulationFields } from "@/lib/classification-effective"
import type { FormExpense, FormService } from "@/types/api"

export interface BuildSimulationRecordPayloadOptions {
  reportBrand?: { logo_url?: string | null; org_name?: string | null } | null
  /** Mapear despesas como no POST inicial; false = lógica de recálculo (eff override). */
  useInitialExpenseEligibility?: boolean
  /** Só o save inicial (pós-classificação) preenche isto. */
  discoveredTags?: StrategyTag[]
}

/**
 * Monta o corpo de POST /simulation-records a partir do estado actual do simulador.
 * Usado após a simulação inicial, após recálculo e no fluxo «Dossiê digital».
 */
export function buildSimulationRecordCreatePayload(
  input: {
    year: number
    companyContext: string
    companyRegime: CompanyRegimeOption
    services: FormService[]
    expenses: FormExpense[]
    formResults: Extract<PersistedResults, { mode: "form" }>
  },
  opts?: BuildSimulationRecordPayloadOptions,
): SimulationRecordCreatePayload {
  const { year, companyContext, companyRegime, services, expenses, formResults } = input
  const {
    reportBrand,
    useInitialExpenseEligibility = true,
    discoveredTags,
  } = opts ?? {}
  const sim = formResults.simulation
  const { classifications, service_classifications, ai_metadata: metaFromResults } = formResults

  const expensesPayload = useInitialExpenseEligibility
    ? expenses.map((e) => ({
        description: e.description,
        amount: e.amount,
        is_eligible:
          classifications.find((c) => c.client_id === e.id)?.is_eligible ??
          classifications.find((c) => c.description === e.description)?.is_eligible ??
          false,
      }))
    : expenses.map((e) => {
        const cls =
          classifications.find((c) => c.client_id === e.id) ??
          classifications.find((c) => c.description === e.description) ??
          null
        const eff = getEffectiveExpenseSimulationFields(cls)
        return {
          description: e.description,
          amount: e.amount,
          is_eligible: eff.is_eligible,
        }
      })

  return {
    company_context: companyContext,
    company_regime: companyRegime ?? "regular",
    year,
    simulation: { ...sim, company_regime: companyRegime ?? "regular" },
    services: services.map((s) => ({
      description: s.description,
      amount: s.amount,
      iss_rate: s.iss_rate,
    })),
    expenses: expensesPayload,
    classifications,
    classifications_snapshot: {
      snapshot_version: 1,
      service_classifications: service_classifications,
      expense_classifications: classifications,
      ai_metadata: metaFromResults ?? undefined,
      discovered_tags: discoveredTags && discoveredTags.length > 0 ? discoveredTags : undefined,
      report_brand: reportBrand?.logo_url || reportBrand?.org_name
        ? {
            logo_url: reportBrand?.logo_url ?? null,
            org_name: reportBrand?.org_name ?? null,
          }
        : undefined,
    },
  }
}
