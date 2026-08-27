import { API_BASE, throwApiError } from "@/lib/http"

export interface EngineValidationCase {
  year: number
  cbs_tribia: string
  cbs_rfb: string
  ibs_tribia: string
  ibs_rfb: string
  divergente: boolean
}

export interface EngineValidationReference {
  name?: string
  url?: string
  /**
   * Versão da Calculadora RFB contra a qual a suíte cruzada rodou. A
   * calculadora é beta e muda de versão: o selo do dossiê diz "validado
   * contra a versão X", nunca só "validado". O backend só devolve
   * `validated: true` com a versão carimbada na evidência
   * (internal/enginevalidation.Build) — opcional aqui só porque toda a
   * `reference` vem vazia quando não há validação.
   */
  version?: string
  run_at?: string
}

export interface EngineValidationResponse {
  validated: boolean
  reference: EngineValidationReference
  scope: string[]
  out_of_scope: string[]
  tolerance_brl?: string
  cases: EngineValidationCase[]
  cases_total: number
  cases_divergent: number
}

/**
 * Espelho de `GET /engine/validation` (W7/B2.3 — backend-engine-go/internal/
 * enginevalidation). Pública, sem autenticação. `validated` só é true com
 * pelo menos 1 caso executado e zero divergências — sem evidência gravada,
 * a rota devolve `validated: false` e `reference` vazia, nunca inventa.
 */
export async function fetchEngineValidation(): Promise<EngineValidationResponse> {
  const res = await fetch(`${API_BASE}/engine/validation`)
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar validação do motor")
  }
  return res.json()
}
