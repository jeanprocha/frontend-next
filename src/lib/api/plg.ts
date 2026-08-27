import { API_BASE, authHeaders, throwApiError, tribiaPlanHeader } from "@/lib/http"

export interface PlgQuotaResponse {
  plan: string
  simulations_today: number
  daily_limit: number
  companies_count: number
  company_limit: number
  enforcement_enabled: boolean
}

export async function fetchPlgQuota(
  token: string,
  userId: string,
  plan: string,
): Promise<PlgQuotaResponse> {
  const res = await fetch(`${API_BASE}/plg/quota`, {
    headers: authHeaders(token, userId, {
      ...tribiaPlanHeader(plan),
    }),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar quota PLG")
  }
  return res.json()
}
