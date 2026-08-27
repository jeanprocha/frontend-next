// Fixtures do smoke E2E (FE-0). Tipadas contra @/types/api (espelho dos DTOs
// do Go) — se o backend mudar o shape de uma resposta, o typecheck deste
// arquivo quebra antes do teste rodar. Dinheiro sempre string decimal;
// delta = líquido projetado − líquido atual (negativo aqui = economia).
import type {
  ClassificationItem,
  CompanyTemplate,
  FormExpenseDTO,
  FormServiceDTO,
  SimulationRecordCreateResponse,
  SimulationRecordDetailResponse,
  SimulationRecordSummary,
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

/** Cota Free com enforcement ligado (FE-4/PR 4f) — condições exatas do PlgLimitMeter. */
export const QUOTA_FREE_FIXTURE: PlgQuotaResponse = {
  plan: "free",
  simulations_today: 3,
  daily_limit: 5,
  companies_count: 1,
  company_limit: 3,
  enforcement_enabled: true,
}

export const E2E_COMPANY_ID_A = "22222222-2222-4222-8222-222222222222"
export const E2E_COMPANY_ID_B = "33333333-3333-4333-8333-333333333333"

/** Carteira com 2 clientes (FE-4/PR 4f) — usada por carteira-workspace.spec.ts. */
export const COMPANIES_FIXTURE: CompanyTemplate[] = [
  {
    id: E2E_COMPANY_ID_A,
    name: "Consultoria Alfa Ltda",
    tax_context: "Empresa de consultoria tributária, regime regular, foco em serviços B2B.",
    default_services: [],
    created_at: "2026-01-10T12:00:00.000Z",
  },
  {
    id: E2E_COMPANY_ID_B,
    name: "Beta Comércio Digital Ltda",
    tax_context: "E-commerce de bens digitais, regime regular, foco em vendas B2C.",
    default_services: [],
    created_at: "2026-02-05T09:30:00.000Z",
  },
]

/**
 * Histórico global (FE-4/PR 4f): 1 registro vinculado a E2E_COMPANY_ID_A e 1
 * legado (company_id nulo) — cobre a listagem de /simulacoes e o upsell A/B
 * (gating-free.spec.ts precisa de ao menos 2 registros).
 */
export const RECORDS_LIST_FIXTURE: SimulationRecordSummary[] = [
  {
    id: "44444444-4444-4444-8444-444444444444",
    created_at: "2026-03-01T10:00:00.000Z",
    year: 2026,
    company_id: E2E_COMPANY_ID_A,
    company_context: COMPANIES_FIXTURE[0].tax_context,
    delta_impact: "-300.00",
    total_projected_tax: "900.00",
    transition_series: [],
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    created_at: "2026-02-15T14:20:00.000Z",
    year: 2026,
    company_id: null,
    company_context: "Empresa legada sem cliente vinculado (registro pré-FE-4)",
    delta_impact: "150.00",
    total_projected_tax: "1150.00",
    transition_series: [],
  },
]

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
