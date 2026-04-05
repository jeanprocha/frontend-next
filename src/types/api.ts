// Tipos TypeScript que espelham os DTOs do backend Go (internal/transport/http/dto.go).
// Valores monetários chegam como string para preservar precisão decimal.

export interface TaxBreakdown {
  gross_tax: string
  credits: string
  net_tax: string
}

export interface SimulationResponse {
  year: number
  current: TaxBreakdown
  projected: TaxBreakdown
  delta: string
  delta_pct: string
}

export interface ServiceInput {
  description: string
  amount: string      // ex: "10000.00"
  iss_rate: string    // ex: "0.05" (5%)
  regime_type?: string // "padrao" | "diferenciado_60" | "reduzido_zero"
}

export interface ExpenseInput {
  description: string
  amount: string
  is_eligible: boolean
  regime_type?: string // "padrao" | "diferenciado_60" | "reduzido_zero"
}

export interface SimulationRequest {
  year: number
  services: ServiceInput[]
  expenses: ExpenseInput[]
}

export interface EvidenceArticle {
  article_id: string
  content: string
  similarity: number
}

export interface ClassificationItem {
  description: string
  is_eligible: boolean
  confidence: number
  justification: string
  legal_base: string
  risk_level: string
  // regime_type: regime tributário do item conforme Art. 131 LC 68/2024.
  // "padrao" | "diferenciado_60" (saúde, educação) | "reduzido_zero" (cesta básica)
  regime_type: string
  evidence: EvidenceArticle[]
  error?: string
}

export interface BatchClassificationResponse {
  total: number
  processed: number
  results: ClassificationItem[]
}

// Formulário de entrada — estrutura interna do frontend antes de chamar a API.
export interface FormService {
  id: string
  description: string
  amount: string
  iss_rate: string
}

export interface FormExpense {
  id: string
  description: string
  amount: string
}

export interface SimulationResult {
  simulation: SimulationResponse
  classifications: ClassificationItem[]
}

// --- Histórico (GET/POST /simulation-records) ---

export interface SimulationRecordSummary {
  id: string
  created_at: string
  year: number
  company_context?: string | null
  delta_impact: string
  total_projected_tax: string
}

export interface SimulationRecordCreatePayload {
  user_id: string
  organization_id?: string | null
  company_context: string
  year: number
  simulation: SimulationResponse
  services: ServiceInput[]
  expenses: ExpenseInput[]
  classifications: ClassificationItem[]
}

export interface SimulationRecordCreateResponse {
  id: string
}

export interface FormServiceDTO {
  id: string
  description: string
  amount: string
  iss_rate: string
}

export interface FormExpenseDTO {
  id: string
  description: string
  amount: string
}

export interface SimulationRecordDetailResponse {
  id: string
  created_at: string
  year: number
  company_context: string
  simulation: SimulationResponse
  services: FormServiceDTO[]
  expenses: FormExpenseDTO[]
  classifications: ClassificationItem[]
}

// --- Templates de Empresa ---

export interface CompanyTemplate {
  id: string
  name: string
  tax_context: string
  default_services: ServiceInput[]
  created_at: string
}

export interface CompanyCreatePayload {
  name: string
  tax_context: string
  default_services: ServiceInput[]
}
