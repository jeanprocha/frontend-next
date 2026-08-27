import { API_BASE, throwApiError } from "@/lib/http"
import type { StrategyTagsListResponse } from "@/types/api"

/** Lista padrões para chips de contexto (cache no backend). */
export async function fetchStrategyTags(): Promise<StrategyTagsListResponse> {
  const res = await fetch(`${API_BASE}/strategy-tags`, { method: "GET" })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar tags de estratégia")
  }
  return res.json()
}
