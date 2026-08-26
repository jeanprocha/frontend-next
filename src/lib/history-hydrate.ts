import { aggregateRagMetadata } from "@/lib/rag-metadata"
import type {
  ClassificationHistorySnapshot,
  ClassificationItem,
  FormExpense,
  FormService,
  SimulationRecordDetailResponse,
} from "@/types/api"
import type { PersistedResults, ResultMeta } from "@/store/useTaxStore"
import type { CompanyRegimeOption } from "@/lib/company-regime"

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

function snapshotFromDetail(d: SimulationRecordDetailResponse): ClassificationHistorySnapshot | null {
  const raw = d.classifications_snapshot
  if (raw == null || typeof raw !== "object") return null
  return raw as ClassificationHistorySnapshot
}

export function simulationDetailToPersisted(
  d: SimulationRecordDetailResponse,
  meta: ResultMeta,
): PersistedResults {
  const snap = snapshotFromDetail(d)

  const classifications: ClassificationItem[] = (() => {
    if (snap?.expense_classifications && snap.expense_classifications.length > 0) {
      return snap.expense_classifications.map((c) => ({
        ...c,
        evidence: c.evidence ?? [],
      }))
    }
    return d.classifications.map((c) => ({
      ...c,
      evidence: c.evidence ?? [],
    }))
  })()

  const expenses: FormExpense[] = d.expenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
  }))

  const ai_metadata = (() => {
    if (snap?.ai_metadata != null) {
      return snap.ai_metadata
    }
    const svc = snap?.service_classifications ?? []
    return aggregateRagMetadata(svc, classifications) ?? null
  })()

  const service_classifications: ClassificationItem[] | undefined = (() => {
    const svcs = snap?.service_classifications
    if (svcs && svcs.length > 0) {
      return svcs.map((c) => ({ ...c, evidence: c.evidence ?? [] }))
    }
    return undefined
  })()

  return {
    mode: "form",
    simulation: d.simulation,
    classifications,
    expenses,
    ai_metadata,
    service_classifications,
    meta,
  }
}
