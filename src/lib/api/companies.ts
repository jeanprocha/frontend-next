import { API_BASE, authHeaders, throwApiError, tribiaFetch, tribiaPlanHeader } from "@/lib/http"
import type { CompanyCreatePayload, CompanyTemplate } from "@/types/api"

export async function listCompanies(
  token: string,
  userId: string,
  plan?: string,
): Promise<CompanyTemplate[]> {
  const res = await tribiaFetch(`${API_BASE}/companies`, {
    headers: authHeaders(token, userId, plan ? tribiaPlanHeader(plan) : undefined),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao listar empresas")
  }
  const data = await res.json()
  return (data ?? []).map((c: CompanyTemplate) => ({
    ...c,
    default_services: Array.isArray(c.default_services) ? c.default_services : [],
  }))
}

export async function createCompany(
  token: string,
  userId: string,
  payload: CompanyCreatePayload,
  plan?: string,
): Promise<{ id: string }> {
  const res = await tribiaFetch(`${API_BASE}/companies`, {
    method: "POST",
    headers: authHeaders(token, userId, {
      "Content-Type": "application/json",
      ...tribiaPlanHeader(plan ?? "free"),
    }),
    body: JSON.stringify({
      ...payload,
      default_services: payload.default_services,
    }),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao criar empresa")
  }
  return res.json()
}

export async function deleteCompany(
  token: string,
  userId: string,
  id: string,
): Promise<void> {
  const res = await tribiaFetch(`${API_BASE}/companies/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token, userId),
  })
  if (!res.ok && res.status !== 204) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao excluir empresa")
  }
}
