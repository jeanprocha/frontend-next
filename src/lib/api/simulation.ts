import { API_BASE, authHeaders, throwApiError, tribiaFetch, tribiaPlanHeader, type ClassifySimulatePlgOpts } from "@/lib/http"
import type {
  SimulationRecordCreatePayload,
  SimulationRecordCreateResponse,
  SimulationRecordDetailResponse,
  SimulationRecordSummary,
  SimulationRequest,
  SimulationResponse,
} from "@/types/api"

// simulate envia serviços e despesas (com is_eligible preenchido pela IA)
// para POST /simulations, que retorna o comparativo atual vs. projetado
// com precisão decimal garantida pelo motor em Go.
//
// delta e delta_pct: delta = líquido projetado − líquido atual (positivo = custo adicional;
// negativo = economia). delta_pct = delta / líquido atual × 100 quando o atual > 0.
export async function simulate(
  payload: SimulationRequest,
  plg?: ClassifySimulatePlgOpts | null,
): Promise<SimulationResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (plg?.token && plg.userId) {
    Object.assign(headers, authHeaders(plg.token, plg.userId, tribiaPlanHeader(plg.plan)) as Record<string, string>)
  }

  const res = await tribiaFetch(`${API_BASE}/simulations`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao calcular simulação")
  }

  return res.json()
}

// --- Histórico de simulações (persistência no Supabase via API Go) ---

export async function saveSimulationRecord(
  token: string,
  userId: string,
  payload: SimulationRecordCreatePayload,
): Promise<SimulationRecordCreateResponse> {
  const res = await tribiaFetch(`${API_BASE}/simulation-records`, {
    method: "POST",
    headers: authHeaders(token, userId, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao salvar histórico")
  }
  return res.json()
}

export async function listSimulationRecords(
  token: string,
  userId: string,
  limit = 20,
  companyId?: string,
): Promise<SimulationRecordSummary[]> {
  const q = new URLSearchParams({ limit: String(limit) })
  if (companyId) q.set("company_id", companyId)
  const res = await tribiaFetch(`${API_BASE}/simulation-records?${q}`, {
    headers: authHeaders(token, userId),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao listar histórico")
  }
  return res.json()
}

export async function getSimulationRecord(
  token: string,
  userId: string,
  id: string,
): Promise<SimulationRecordDetailResponse> {
  const res = await tribiaFetch(`${API_BASE}/simulation-records/${encodeURIComponent(id)}`, {
    headers: authHeaders(token, userId),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar simulação")
  }
  return res.json()
}

/**
 * URL do GET público: no browser usa o proxy same-origin do Next (evita 404
 * quando a env aponta para :3000); no servidor, chama o motor directamente.
 */
function resolvePublicSimulationRecordUrl(id: string): string {
  const eid = encodeURIComponent(id)
  if (typeof globalThis !== "undefined" && globalThis.location?.origin) {
    return `${globalThis.location.origin}/api/public/simulation-records/${eid}`
  }
  return `${API_BASE}/public/simulation-records/${eid}`
}

/** Leitura pública do dossié (sem JWT; o UUID de simulação é o segredo de partilha). */
export async function getPublicSimulationRecord(id: string): Promise<SimulationRecordDetailResponse> {
  const res = await tribiaFetch(resolvePublicSimulationRecordUrl(id), { cache: "no-store" })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao carregar dossiê")
  }
  return res.json()
}
