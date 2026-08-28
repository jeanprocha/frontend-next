// Tipos TypeScript que espelham os DTOs do backend Go (internal/transport/http/dto.go).
// Valores monetários chegam como string para preservar precisão decimal.

/**
 * Decomposição do bruto por tributo (W7/B2.1, exposta na W2/PR2). A soma pode
 * divergir de gross_tax em até R$ 0,01 por arredondamento independente — não
 * é erro. Zerada (não ausente) em regimes sem decomposição natural (MEI,
 * Simples, imobiliário) — ver o comentário em cada ramo de calculator.go.
 */
export interface TaxComponents {
  pis: string
  cofins: string
  iss: string
  cbs: string
  ibs: string
}

export interface CalculationStepInput {
  name: string
  /** Precisão total — não arredondado a 2 casas. */
  value: string
}

/**
 * Um passo da memória de cálculo (W2/PR1-2) — fórmula legível e operandos
 * nomeados o suficiente para reproduzir output à mão, sem acesso ao código.
 */
export interface CalculationStep {
  /** Serviço/despesa a que este passo se refere; ausente para um agregado. */
  item?: string
  label: string
  formula: string
  inputs?: CalculationStepInput[]
  /** Precisão total — não arredondado a 2 casas. */
  output: string
  /** true quando output foi arredondado como parte deste passo. */
  rounded: boolean
}

export interface TaxBreakdown {
  gross_tax: string
  credits: string
  net_tax: string
  /**
   * O backend sempre envia esta chave (zerada, não ausente, em registro
   * antigo ou regime sem decomposição) — opcional aqui só para não obrigar
   * fixture/teste existente a declará-la; ver TaxComponents.
   */
  components?: TaxComponents
  /** Ausente em registro salvo antes do W2/PR1-2 (compatibilidade retroativa). */
  trace?: CalculationStep[]
}

/**
 * Proveniência de uma linha da tabela de transição — auditada número a
 * número na Onda 2/PR 7 (W1), exposta ao dossiê na W2/PR2 em vez de ficar só
 * em comentário de código no backend.
 */
export interface RuleBasis {
  kind: "lei_calendario" | "estimativa_oficial" | "premissa_tribia"
  note: string
}

/** Insumos de transição por ano (espelho do motor Go / auditoria PRO). */
export interface TransitionYearFactors {
  year: number
  pis_cofins_factor: string
  cbs_rate: string
  ibs_rate: string
  combined_projected_rate?: string
  iss_municipal_factor?: string
  iss_model?: string
  /** Ausente em registro salvo antes do W2/PR2. */
  basis?: RuleBasis
}

export interface TransitionSeriesPoint {
  year: number
  old_tax_net: string
  new_tax_net: string
  total_tax_net: string
  /** Presentes nas respostas novas do motor; permitem foco temporal sem novo POST. */
  current?: TaxBreakdown
  projected?: TaxBreakdown
  delta?: string
  delta_pct?: string
  factors?: TransitionYearFactors
}

/** Um ponto de CreditLeak.annual_values — lost_credit projetado para um ano específico da transição. */
export interface CreditLeakAnnualValue {
  year: number
  lost_credit: string
}

/** Vazamento ilustrativo: despesa inelegível e crédito CBS/IBS não apropriado (calculado no backend). */
export interface CreditLeak {
  description: string
  value: string
  lost_credit: string
  reason?: string
  fix?: string
  regime_type?: string
  /** Citação do RAG que já embasou a classificação (passthrough de ExpenseInput.legal_base) — vazio quando a IA não citou nada, nunca inventada. */
  legal_base?: string
  /** lost_credit projetado ano a ano, 2026–2033, mesma despesa (Etapa C/PR5). */
  annual_values?: CreditLeakAnnualValue[]
  /** Faixa determinística — nunca escrita pela LLM. "baixo" | "medio" | "alto". */
  effort?: string
  /** Faixa determinística — nunca escrita pela LLM. "baixo" | "medio" | "alto". */
  risk?: string
  /** Faixa determinística — nunca escrita pela LLM. "baixa" | "media" | "alta". */
  priority?: string
}

export interface SimulationResponse {
  year: number
  /** Eco do perfil tributário no simulador (persistido no histórico / PDF). */
  company_regime?: string
  /**
   * Ramo do motor que produziu este resultado (ex.: "regular" para entrada
   * vazia) — NUNCA o valor bruto de company_regime acima; os dois podem
   * divergir (entrada "" vira ramo "regular"). Ausente em registro salvo
   * antes do W2/PR2.
   */
  regime?: string
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
  /**
   * true quando GET histórico reconstituiu fatores/breakdown mínimo no servidor (registo antigo).
   * Breakdown completo de bruto/créditos fica no snapshot ao gravar uma nova simulação.
   */
  transition_series_enriched?: boolean
  /** Modo de convivência no motor: duas simulações completas comparáveis por ano (ex.: dual_comparative_v1). */
  overlap_model?: string
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
  /** Citação do RAG que já embasou a classificação (ClassificationItem.legal_base) — o motor só ecoa, nunca interpreta. */
  legal_base?: string
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

/** Hierarquia normativa estruturada (GET /credit-classifications* — campo `legal_path` por evidência). */
export interface LegalPath {
  article_label?: string
  paragraph?: string
  inciso?: string
  alinea?: string
  span_note?: string
}

/** Metadados hierárquicos do chunk (corpus legal), espelhando o backend Go. */
export interface LawChunkMetadata {
  source?: string
  type?: string
  article_id?: string
  article_label?: string
  paragraph?: string
  inciso?: string
  alinea?: string
  span_note?: string
  structure_version?: string
  part?: string
  total_parts?: string
  [key: string]: string | undefined
}

export interface EvidenceArticle {
  article_id: string
  content: string
  similarity: number
  /** Metadados determinísticos da ingestão (artigo, parágrafo, inciso, alínea). */
  metadata?: LawChunkMetadata
  /** Campos espelhados de `metadata` para citação tipada (prioridade em `formatLegalCitationFromMetadata`). */
  legal_path?: LegalPath
  /** Substrings validadas no servidor para realce PRO (âncoras fortes). */
  relevant_snippets?: string[]
  /** Substrings com nexo mais fraco; UI pode realçar com estilo distinto. */
  relevant_snippets_tentative?: string[]
}

/** Resposta de GET /law/articles/{id} — artigo do corpus legal remontado a partir dos chunks. */
export interface LawArticleResponse {
  id: string
  title: string
  content: string
  source: string
}

/** GET /law/articles/{id}/pdf-anchor — Pro/Premium, autenticado. */
export interface LawPdfAnchorResponse {
  pdf_url: string
  page: number
  pdf_coord_y: string
  convention: string
  lei_version?: string
  prf_file?: string
}

/** Índices em pontos de código Unicode no texto do contexto enviado ao classificador (início inclusivo, fim exclusivo). */
export interface MatchedSpan {
  start: number
  end: number
}

/**
 * Substituição manual (Human-in-the-loop) da classificação IA.
 *
 * Invariante: os campos `is_eligible` / `regime_type` na raiz do ClassificationItem
 * representam SEMPRE a sugestão original da IA após o batch — nunca sobrescritos.
 * A decisão efetiva para o motor Go é lida via getEffectiveExpenseSimulationFields().
 */
export interface ConsultantClassificationOverride {
  /** Decisão efetiva que será enviada ao motor Go. */
  is_eligible: boolean
  /** "padrao" | "diferenciado_60" | "reduzido_zero" */
  regime_type: string
  /** Opcional — aparece no tooltip como "Nota do Especialista". */
  justification?: string
  /** ISO 8601 — evento de auditoria; imutável após salvar. */
  overridden_at: string
}

export interface ClassificationItem {
  /** Eco do batch (id da linha no formulário); evita colisão com descrições duplicadas. */
  client_id?: string
  description: string
  /** Sugestão da IA — NUNCA alterar após o batch. Usar getEffectiveExpenseSimulationFields(). */
  is_eligible: boolean
  confidence: number
  justification: string
  legal_base: string
  risk_level: string
  // regime_type: regime tributário do item conforme Art. 131 da legislação vigente.
  // "padrao" | "diferenciado_60" (saúde, educação) | "reduzido_zero" (cesta básica)
  /** Sugestão da IA — NUNCA alterar após o batch. Usar getEffectiveExpenseSimulationFields(). */
  regime_type: string
  evidence: EvidenceArticle[]
  /** Âncora no contexto da empresa (runas); omitido se a LLM não devolver ou validação falhar. */
  matched_span?: MatchedSpan
  error?: string
  /**
   * Substituição manual pelo consultor (Human-in-the-loop).
   * Campo client-side: nunca serializado para o backend; serve apenas para
   * reidratação local do estado durante a sessão de auditoria.
   * Quando presente, prevalece sobre is_eligible/regime_type para o motor Go.
   */
  consultant_override?: ConsultantClassificationOverride
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

/** Desagregação do score global (transparência “Como calculámos isto”). */
export interface AiMetadataBreakdown {
  /** Média das maiores similaridades RAG por linha com evidência (0–1). */
  rag_similarity_mean: number
  /** Média da confiança do classificador nas linhas sem erro (0–1). */
  llm_confidence_mean: number
  /** Linhas classificadas com pelo menos um trecho recuperado / total classificadas sem erro. */
  evidence_coverage: number
  classified_count: number
  with_evidence_count: number
}

/** Metadados agregados do RAG pós-classificação (relevância da recuperação, não “certeza” do LLM). */
export interface AiMetadata {
  /** Score combinado 0–1 para o gauge macro (ver breakdown). */
  confidence_score: number
  sources_analyzed: string[]
  tokens_processed?: number
  breakdown?: AiMetadataBreakdown
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

/** Snapshot rico para reidratar o dashboard como na 1.ª execução (evidências RAG, ai_metadata). */
export interface ReportBrandSnapshot {
  logo_url?: string | null
  org_name?: string | null
}

export interface ClassificationHistorySnapshot {
  snapshot_version?: number
  service_classifications?: ClassificationItem[]
  expense_classifications?: ClassificationItem[]
  ai_metadata?: AiMetadata
  discovered_tags?: StrategyTag[]
  /** White-label (Premium) persistido para o dossié público. */
  report_brand?: ReportBrandSnapshot | null
}

export interface SimulationRecordSummary {
  id: string
  created_at: string
  year: number
  /** Cliente da carteira (FE-4/W9) — ausente em registos legados (sempre NULL até a FE-4). */
  company_id?: string | null
  company_context?: string | null
  delta_impact: string
  total_projected_tax: string
  /** Série agregada (listagem) para sparkline / preview Time-Traveler sem GET completo. */
  transition_series?: TransitionSeriesPoint[]
  strategy_insight?: string | null
}

export interface SimulationRecordCreatePayload {
  /** Cliente da carteira (FE-4/W9) — presente quando a simulação nasce no workspace /clientes/[companyId]. */
  company_id?: string
  company_context: string
  /** Perfil do simulador (ex.: exportadora, aliquota_zero) para PDF e reidratação. */
  company_regime?: string
  year: number
  simulation: SimulationResponse
  services: ServiceInput[]
  expenses: ExpenseInput[]
  classifications: ClassificationItem[]
  /** UI fiel: serviços + despesas + ai_metadata; opcional para compatibilidade com registos antigos. */
  classifications_snapshot?: ClassificationHistorySnapshot
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
  /** Cliente da carteira (FE-4/W9) — ausente em registos legados (sempre NULL até a FE-4). */
  company_id?: string | null
  company_context: string
  company_regime?: string
  simulation: SimulationResponse
  services: FormServiceDTO[]
  expenses: FormExpenseDTO[]
  classifications: ClassificationItem[]
  /** Presente em registos novos; contém ai_metadata e classificações de serviço para reidratação. */
  classifications_snapshot?: ClassificationHistorySnapshot | null
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
