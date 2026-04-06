/**
 * Gatilhos de UI para feedback instantâneo no campo de contexto da empresa.
 * Heurística ilustrativa apenas; não substitui classificação do backend nem RAG.
 */
export const STRATEGY_KEYWORDS = [
  {
    key: "saas",
    patterns: ["saas", "software", "licenciamento", "assinatura"],
    label: "Modelo Digital Detectado",
    color:
      "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50",
  },
  {
    key: "export",
    patterns: ["exportação", "exterior", "exportar", "venda fora"],
    label: "Imunidade Art. 52 (Export)",
    color:
      "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
  },
  {
    key: "real_estate",
    patterns: ["imobiliário", "aluguel", "incorporação", "venda de imóvel"],
    label: "Regime Específico Imobiliário",
    color:
      "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
  },
  {
    key: "liberal",
    patterns: ["advogado", "médico", "engenheiro", "engenharia", "profissional liberal"],
    label: "Redutor de Alíquota (30%)",
    color:
      "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50",
  },
] as const

export type StrategyKeywordKey = (typeof STRATEGY_KEYWORDS)[number]["key"]
