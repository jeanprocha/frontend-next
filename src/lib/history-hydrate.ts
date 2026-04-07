import { aggregateRagMetadata } from "@/lib/rag-metadata"
import type {
  ClassificationItem,
  FormExpense,
  FormService,
  SimulationRecordDetailResponse,
} from "@/types/api"
import type { CompanyRegimeOption, PersistedResults, ResultMeta } from "@/store/useTaxStore"

const REGIME_OPTIONS: CompanyRegimeOption[] = [
  "regular",
  "mei",
  "simples_puro",
  "simples_hibrido",
  "diferenciado_60",
  "aliquota_zero",
  "exportadora",
  "entidade_imune",
  "imobiliario_venda",
  "imobiliario_aluguel",
  "prof_liberal",
]

export function parseCompanyRegimeFromDetail(
  d: SimulationRecordDetailResponse,
): CompanyRegimeOption {
  const raw = (d.company_regime ?? d.simulation.company_regime ?? "regular").trim()
  return REGIME_OPTIONS.includes(raw as CompanyRegimeOption)
    ? (raw as CompanyRegimeOption)
    : "regular"
}

export function detailServicesToFormServices(
  services: SimulationRecordDetailResponse["services"],
): FormService[] {
  return services.map((s) => ({
    id: s.id || crypto.randomUUID(),
    description: s.description ?? "",
    amount: s.amount ?? "",
    iss_rate: s.iss_rate ?? "0.05",
  }))
}

export function simulationDetailToPersisted(
  d: SimulationRecordDetailResponse,
  meta: ResultMeta,
): PersistedResults {
  const classifications: ClassificationItem[] = d.classifications.map((c) => ({
    ...c,
    evidence: c.evidence ?? [],
  }))
  const expenses: FormExpense[] = d.expenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
  }))
  const ai_metadata = aggregateRagMetadata([], classifications)
  return {
    mode: "form",
    simulation: d.simulation,
    classifications,
    expenses,
    ai_metadata: ai_metadata ?? null,
    meta,
  }
}
