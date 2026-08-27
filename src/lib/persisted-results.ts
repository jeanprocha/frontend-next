import type { AiMetadata, ClassificationItem, FormExpense, SimulationResponse } from "@/types/api"

// Camada base: consumido tanto por lib/history-hydrate.ts (histórico/público,
// não pode depender de features/) quanto por features/simulation/machine/
// (máquina de estados do pipeline ao vivo) — por isso vive aqui, não em
// features/simulation/machine/machine-types.ts.

export interface ResultMeta {
  createdAt: string
  companyContext: string
  year: number
  /** Registo no histórico (API) após gravação bem-sucedida; necessário para dossié /report/[id]. */
  recordId?: string
  /**
   * Cliente da carteira (FE-4/W9): presente quando a simulação nasce no
   * workspace /clientes/[companyId] ou ao reabrir um registo com company_id.
   * A IDENTIDADE do cliente vive na URL — este campo só transporta o
   * vínculo do RESULTADO até o persist; nunca é estado global.
   */
  companyId?: string
}

export interface PersistedResults {
  mode: "form"
  simulation: SimulationResponse
  classifications: ClassificationItem[]
  expenses: FormExpense[]
  meta?: ResultMeta
  /** Agregado RAG (serviços + despesas); omitido em registos antigos / sem evidências. */
  ai_metadata?: AiMetadata | null
  /**
   * Classificações dos serviços (regime_type por serviço) — pré-requisito para
   * recalcular a simulação após override sem novo batch de classificação IA.
   * Ausente em registos antigos; fallback "padrao" no recálculo.
   */
  service_classifications?: ClassificationItem[]
}
