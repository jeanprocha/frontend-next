// Barrel de compatibilidade: `@/lib/api` continua resolvendo para o mesmo
// conjunto de símbolos de antes (FE-1 §5 do plano) — zero mudança de import
// nos consumidores. Os re-exports de formatBRL/formatPct/formatPctFraction
// que existiam aqui foram removidos: os consumidores agora importam direto
// de `@/lib/format-money`.
export {
  ApiError,
  errorDetailsFromUnknown,
  tribiaPlanHeader,
  type ClassifySimulatePlgOpts,
} from "@/lib/http"

export { fetchPlgQuota, type PlgQuotaResponse } from "@/lib/api/plg"
export { classifyBatch } from "@/lib/api/classification"
export { fetchStrategyTags } from "@/lib/api/strategy-tags"
export { joinWaitlist } from "@/lib/api/waitlist"
export {
  fetchLawArticle,
  fetchLawPdfAnchor,
  fetchPublicLawPdfAnchor,
  fetchLawCorpus,
  type LawCorpusDocument,
  type LawCorpusResponse,
} from "@/lib/api/legal"
export {
  fetchEngineValidation,
  type EngineValidationResponse,
  type EngineValidationCase,
  type EngineValidationReference,
} from "@/lib/api/engine"
export { listCompanies, createCompany, deleteCompany } from "@/lib/api/companies"
export {
  simulate,
  saveSimulationRecord,
  listSimulationRecords,
  getSimulationRecord,
  getPublicSimulationRecord,
} from "@/lib/api/simulation"
export { queryKeys } from "@/lib/api/query-keys"
