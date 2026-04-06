// Tipos TypeScript que espelham os DTOs do backend Go (internal/transport/http/dto.go).
// Valores monetários chegam como string para preservar precisão decimal.

export interface TaxBreakdown {
  gross_tax: string
  credits: string
  net_tax: string
}

export interface TransitionSeriesPoint {
  year: number
  old_tax_net: string
  new_tax_net: string
  total_tax_net: string
}

/** Vazamento ilustrativo: despesa inelegível e crédito CBS/IBS não apropriado (calculado no backend). */
export interface CreditLeak {
  description: string
  value: string
  lost_credit: string
  reason?: string
  fix?: string
  regime_type?: string
}

export interface SimulationResponse {
  year: number
  /** Eco do perfil tributário no simulador (persistido no histórico / PDF). */
  company_regime?: string
  current: TaxBreakdown
  projected: TaxBreakdown
  /** projetado − atual: positivo = custo adicional; negativo = economia */
  delta: string
  delta_pct: string
  /** Insight educativo pós-simulação (LLM); omitido se API desligou STRATEGY_INSIGHT_ENABLED. */
  strategy_insight?: string
  /** Soma dos valores dos serviços (receita); para gráfico em % da receita. */
  revenue_total?: string
  /** Trajetória 2026–2033 (legado vs CBS/IBS no modelo TribIA). */
  transition_series?: TransitionSeriesPoint[]
  /** Despesas inelegíveis com crédito hipotético perdido (ilustrativo). */
  credit_leaks?: CreditLeak[]
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
  /**
   * Perfil da empresa: omitir ou "regular" = PIS/COFINS/ISS vs CBS/IBS;
   * "mei" = DAS fixo; "simples_puro" | "simples_hibrido" = baseline Simples ilustrativo no atual;
   * híbrido = projeção CBS/IBS integral com créditos como o regular;
   * "diferenciado_60" = atual como regular; projeção de saída com redução de 60% em toda a receita;
   * "aliquota_zero" = atual como regular; projeção CBS/IBS zero na receita (cesta básica / social, ilustrativo);
   * "exportadora" = atual como regular; projeção CBS/IBS zero na receita (imunidade ilustrativa na saída; créditos nas compras; líquido projetado pode ser negativo — saldo credor ilustrativo; distinto de cesta básica na narrativa);
   * "entidade_imune" = atual como regular (baseline ilustrativo); projeção CBS/IBS zero na saída e sem créditos no modelo (consumidor final ilustrativo; distinto de exportadora);
   * "imobiliario_venda" / "imobiliario_aluguel" = projeção com redutor de alíquota e base (ilustrativo);
   * "prof_liberal" = atual como regular; projeção com 70% da alíquota CBS+IBS padrão do ano (redução ilustrativa de 30%; profissões regulamentadas).
   */
  company_regime?: string
  /** Texto livre; o ramo MEI no motor exige company_regime "mei" (sem inferência por texto). */
  company_context?: string
  /** R$ abatidos da receita total na projeção imobiliária; omitir = variáveis de ambiente no backend ou 0 */
  imobiliario_redutor_ajuste_brl?: string
  services: ServiceInput[]
  expenses: ExpenseInput[]
}

export interface EvidenceArticle {
  article_id: string
  content: string
  similarity: number
}

/** Resposta de GET /law/articles/{id} — artigo LC 68 remontado a partir dos chunks. */
export interface LawArticleResponse {
  id: string
  title: string
  content: string
  source: string
}

export interface ClassificationItem {
  /** Eco do batch (id da linha no formulário); evita colisão com descrições duplicadas. */
  client_id?: string
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

/** Linha de GET /strategy-tags ou descoberta pós-classificação. */
export interface StrategyTag {
  pattern: string
  label: string
  category?: string
  color_scheme: string
}

export interface StrategyTagsListResponse {
  tags: StrategyTag[]
}

export interface BatchClassificationResponse {
  total: number
  processed: number
  results: ClassificationItem[]
  /** Padrões realmente inseridos na base neste batch. */
  discovered_tags?: StrategyTag[]
}

/** Metadados agregados do RAG pós-classificação (relevância da recuperação, não “certeza” do LLM). */
export interface AiMetadata {
  confidence_score: number
  sources_analyzed: string[]
  tokens_processed?: number
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
  organization_id?: string | null
  company_context: string
  /** Perfil do simulador (ex.: exportadora, aliquota_zero) para PDF e reidratação. */
  company_regime?: string
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
  company_regime?: string
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
