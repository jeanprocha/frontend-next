// Fixtures do smoke E2E (FE-0). Tipadas contra @/types/api (espelho dos DTOs
// do Go) — se o backend mudar o shape de uma resposta, o typecheck deste
// arquivo quebra antes do teste rodar. Dinheiro sempre string decimal;
// delta = líquido projetado − líquido atual (negativo aqui = economia).
import type {
  ClassificationItem,
  FormExpenseDTO,
  FormServiceDTO,
  SimulationRecordCreateResponse,
  SimulationRecordDetailResponse,
  SimulationResponse,
} from "@/types/api"
// PlgQuotaResponse vive em lib/api.ts (não em types/api.ts) — import type-only,
// não traz o client HTTP para o bundle do teste.
import type { PlgQuotaResponse } from "@/lib/api"

export const E2E_RECORD_ID = "11111111-1111-4111-8111-111111111111"

export const SIMULATION_FIXTURE: SimulationResponse = {
  year: 2026,
  company_regime: "regular",
  current: { gross_tax: "1200.00", credits: "0.00", net_tax: "1200.00" },
  projected: { gross_tax: "1100.00", credits: "200.00", net_tax: "900.00" },
  delta: "-300.00",
  delta_pct: "-25.00",
  revenue_total: "12000.00",
  strategy_insight: "Fixture E2E — sem chamada real ao motor Go.",
  transition_series: [],
}

export const SAVE_RECORD_FIXTURE: SimulationRecordCreateResponse = {
  id: E2E_RECORD_ID,
}

/**
 * Resposta do motor após um recálculo (override do consultor). Delta e
 * strategy_insight distintos de SIMULATION_FIXTURE — o teste de override→recalc
 * (e2e/override-recalc.spec.ts) usa o texto do insight como âncora de conteúdo
 * (mais robusto que casar formatação monetária).
 */
export const RECALC_SIMULATION_FIXTURE: SimulationResponse = {
  year: 2026,
  company_regime: "regular",
  current: { gross_tax: "1200.00", credits: "0.00", net_tax: "1200.00" },
  projected: { gross_tax: "1100.00", credits: "0.00", net_tax: "1100.00" },
  delta: "-100.00",
  delta_pct: "-8.33",
  revenue_total: "12000.00",
  strategy_insight: "Fixture E2E — recálculo após override do consultor.",
  transition_series: [],
}

export const QUOTA_FIXTURE: PlgQuotaResponse = {
  plan: "pro",
  simulations_today: 0,
  daily_limit: 999,
  companies_count: 0,
  company_limit: 10,
  enforcement_enabled: false,
}

const SERVICE_CLASSIFICATION_FIXTURE: ClassificationItem = {
  description: "Consultoria tributária",
  is_eligible: true,
  confidence: 0.92,
  justification: "Receita de serviço padrão (fixture E2E).",
  legal_base: "Art. 47, LC 68/2024",
  risk_level: "baixo",
  regime_type: "padrao",
  evidence: [],
}

const EXPENSE_CLASSIFICATION_FIXTURE: ClassificationItem = {
  description: "Licença de software ERP",
  is_eligible: true,
  confidence: 0.9,
  justification: "Insumo elegível a crédito (fixture E2E).",
  legal_base: "Art. 47, LC 68/2024",
  risk_level: "baixo",
  regime_type: "padrao",
  evidence: [],
}

const RECORD_SERVICES: FormServiceDTO[] = [
  { id: "svc-1", description: "Consultoria tributária", amount: "12000.00", iss_rate: "0.05" },
]

const RECORD_EXPENSES: FormExpenseDTO[] = [
  { id: "exp-1", description: "Licença de software ERP", amount: "3000.00" },
]

export const RECORD_DETAIL_FIXTURE: SimulationRecordDetailResponse = {
  id: E2E_RECORD_ID,
  created_at: "2026-08-26T12:00:00.000Z",
  year: 2026,
  company_context: "Empresa SaaS B2B, regime regular IBS/CBS, fornecimento de software como serviço",
  company_regime: "regular",
  simulation: SIMULATION_FIXTURE,
  services: RECORD_SERVICES,
  expenses: RECORD_EXPENSES,
  classifications: [EXPENSE_CLASSIFICATION_FIXTURE],
  classifications_snapshot: {
    snapshot_version: 1,
    service_classifications: [SERVICE_CLASSIFICATION_FIXTURE],
    expense_classifications: [EXPENSE_CLASSIFICATION_FIXTURE],
    ai_metadata: {
      confidence_score: 0.9,
      sources_analyzed: ["LC 68/2024"],
    },
  },
}
