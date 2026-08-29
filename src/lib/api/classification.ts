import { API_BASE, authHeaders, throwApiError, tribiaFetch, tribiaPlanHeader, type ClassifySimulatePlgOpts } from "@/lib/http"
import type { BatchClassificationResponse } from "@/types/api"

// classifyBatch envia uma lista de descrições de despesas para o endpoint
// POST /credit-classifications/batch, que usa RAG + LLM para determinar
// elegibilidade a crédito de IBS/CBS conforme a legislação vigente.
export async function classifyBatch(
  expenses: { description: string; context?: string; client_id?: string }[],
  maxConcurrency = 5,
  plg?: ClassifySimulatePlgOpts | null,
): Promise<BatchClassificationResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (plg?.token && plg.userId) {
    Object.assign(headers, authHeaders(plg.token, plg.userId, tribiaPlanHeader(plg.plan)) as Record<string, string>)
  }

  const res = await tribiaFetch(`${API_BASE}/credit-classifications/batch`, {
    method: "POST",
    headers,
    body: JSON.stringify({ expenses, max_concurrency: maxConcurrency }),
  })

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao classificar despesas")
  }

  return res.json()
}
