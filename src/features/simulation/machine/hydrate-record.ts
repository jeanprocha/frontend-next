// Único ponto de hidratação a partir de um registo salvo (Etapa N/PR 1) —
// antes duplicado em history-page-view.tsx e em
// app/clientes/[companyId]/simulacoes/[recordId]/page.tsx, que divergiram
// em exatamente dois pontos: o histórico global esquecia setCompanyRegime
// (regime da sessão anterior ficava valendo) e não passava recordId/companyId
// no meta (openDossier não reconhecia o registo como já existente e criava
// um novo simulation-record a cada "Gerar Dossiê digital").
import { useTaxStore } from "@/store/useTaxStore"
import {
  detailServicesToFormServices,
  parseCompanyRegimeFromDetail,
  simulationDetailToPersisted,
} from "@/lib/history-hydrate"
import type { SimulationRecordDetailResponse } from "@/types/api"
import { simulationMachine } from "./machine-store"

/**
 * Aplica um registo salvo ao store de formulário e hidrata a máquina do
 * pipeline — usado tanto pelo histórico global quanto pelo workspace do
 * cliente. `companyId` é o fallback (workspace) quando o registo em si não
 * carrega `company_id` (registos legados); o histórico global não passa
 * `companyId` — o vínculo do resultado é só o que o próprio registo traz.
 */
export function hydrateSimulationFromRecord(
  detail: SimulationRecordDetailResponse,
  opts?: { companyId?: string },
): void {
  const { setYear, setCompanyContext, setCompanyRegime, setServices, setExpenses } = useTaxStore.getState()

  setYear(detail.year)
  setCompanyContext(detail.company_context)
  setCompanyRegime(parseCompanyRegimeFromDetail(detail))
  setServices(detailServicesToFormServices(detail.services))
  setExpenses(detail.expenses.map((e) => ({ id: e.id, description: e.description, amount: e.amount })))

  simulationMachine.hydrateResults(
    simulationDetailToPersisted(detail, {
      createdAt: detail.created_at,
      companyContext: detail.company_context ?? "",
      year: detail.year,
      recordId: detail.id,
      companyId: detail.company_id ?? opts?.companyId,
    }),
  )
}
