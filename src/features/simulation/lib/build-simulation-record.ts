import type { PersistedResults } from "@/lib/persisted-results"
import type { FormExpense, FormService, ReportBrandSnapshot } from "@/types/api"
import type { CompanyRegimeOption } from "@/lib/company-regime"
import type { SimulationRecord } from "@/lib/report-contract"

type FormResults = Extract<PersistedResults, { mode: "form" }>

/**
 * Envelope de SimulationRecord (dossié) a partir do resultado ao vivo da
 * máquina + store. `services`/`expenses` vêm do store (não de
 * `formResults`) — o dossié ao vivo sempre mostrou os valores editáveis da
 * sessão, não o eco gravado no resultado.
 */
export function buildSimulationRecord(
  formResults: FormResults,
  services: FormService[],
  expenses: FormExpense[],
  companyRegime: CompanyRegimeOption,
  reportBrand: ReportBrandSnapshot | null,
): SimulationRecord {
  return {
    simulation: formResults.simulation,
    classifications: formResults.classifications,
    serviceClassifications: formResults.service_classifications,
    expenses,
    services,
    aiMetadata: formResults.ai_metadata,
    meta: formResults.meta,
    reportBrand,
    companyRegime,
  }
}
