import type {
  BatchClassificationResponse,
  StrategyTagsListResponse,
  CompanyCreatePayload,
  CompanyTemplate,
  LawArticleResponse,
  LawPdfAnchorResponse,
  SimulationRecordCreatePayload,
  SimulationRecordCreateResponse,
  SimulationRecordDetailResponse,
  SimulationRecordSummary,
  SimulationRequest,
  SimulationResponse,
} from "@/types/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

/** Erro de API com campos opcionais alinhados a `ErrorResponse` do backend Go (`request_id` para suporte). */
export class ApiError extends Error {
  readonly requestId?: string
  readonly code?: string
  readonly status?: number
  readonly limit?: number
  readonly used?: number
  readonly plan?: string

  constructor(
    message: string,
    opts?: {
      requestId?: string
      code?: string
      status?: number
      limit?: number
      used?: number
      plan?: string
    },
  ) {
    super(message)
    this.name = "ApiError"
    this.requestId = opts?.requestId
    this.code = opts?.code
    this.status = opts?.status
    this.limit = opts?.limit
    this.used = opts?.used
    this.plan = opts?.plan
  }
}

function throwApiFailure(res: Response, raw: unknown, fallback: string): never {
  const o = raw as {
    error?: string
    request_id?: string
    code?: string
    limit?: number
    used?: number
    plan?: string
  }
  const msg =
    (typeof o?.error === "string" && o.error.trim()) || fallback
  throw new ApiError(msg, {
    requestId:
      typeof o?.request_id === "string" && o.request_id.trim()
        ? o.request_id.trim()
        : undefined,
    code: typeof o?.code === "string" ? o.code : undefined,
    status: res.status,
    limit: typeof o?.limit === "number" ? o.limit : undefined,
    used: typeof o?.used === "number" ? o.used : undefined,
    plan: typeof o?.plan === "string" ? o.plan : undefined,
  })
}

/** Mensagem e `request_id` para UI (erros de mutação / fetch). */
export function errorDetailsFromUnknown(e: unknown): {
  message: string
  requestId?: string
} {
  if (e instanceof ApiError)
    return { message: e.message, requestId: e.requestId }
  if (e instanceof Error) return { message: e.message }
  return { message: String(e) }
}

/**
 * Headers para rotas protegidas. Com AUTH_SKIP=true no backend Go, o middleware exige
 * X-User-ID (o JWT sozinho não basta). Em produção com Clerk + JWKS, o header é ignorado
 * na autorização, mas enviar o mesmo sub não prejudica.
 */
function authHeaders(
  token: string,
  userId: string,
  extra?: Record<string, string>,
): HeadersInit {
  const uid = userId.trim()
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(extra ?? {}),
  }
  if (uid) {
    h["X-User-ID"] = uid
  }
  return h
}

/** Header de plano para quotas PLG no backend (Go). */
export function tribiaPlanHeader(plan: string): Record<string, string> {
  return { "X-Tribia-Plan": plan }
}

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
    throwApiFailure(res, raw, "Erro ao carregar quota PLG")
  }
  return res.json()
}

function parsePlgErrorPayload(status: number, body: unknown): ApiError {
  const o = body as {
    error?: string
    request_id?: string
    code?: string
    limit?: number
    used?: number
    plan?: string
  }
  const msg =
    (typeof o?.error === "string" && o.error.trim()) ||
    (status === 403 ? "Limite do plano atingido" : "Erro na API")
  return new ApiError(msg, {
    requestId:
      typeof o?.request_id === "string" && o.request_id.trim()
        ? o.request_id.trim()
        : undefined,
    code: typeof o?.code === "string" ? o.code : undefined,
    status,
    limit: typeof o?.limit === "number" ? o.limit : undefined,
    used: typeof o?.used === "number" ? o.used : undefined,
    plan: typeof o?.plan === "string" ? o.plan : undefined,
  })
}

export interface ClassifySimulatePlgOpts {
  token: string
  userId: string
  plan: string
}

// classifyBatch envia uma lista de descrições de despesas para o endpoint
// POST /credit-classifications/batch, que usa RAG + LLM para determinar
// elegibilidade a crédito de IBS/CBS conforme a LC 68/2024.
export async function classifyBatch(
  expenses: { description: string; context?: string; client_id?: string }[],
  maxConcurrency = 5,
  plg?: ClassifySimulatePlgOpts | null,
): Promise<BatchClassificationResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (plg?.token && plg.userId) {
    Object.assign(headers, authHeaders(plg.token, plg.userId, tribiaPlanHeader(plg.plan)) as Record<string, string>)
  }

  const res = await fetch(`${API_BASE}/credit-classifications/batch`, {
    method: "POST",
    headers,
    body: JSON.stringify({ expenses, max_concurrency: maxConcurrency }),
  })

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    if (res.status === 403 && raw && typeof raw === "object" && "code" in raw) {
      throw parsePlgErrorPayload(res.status, raw)
    }
    throwApiFailure(res, raw, "Erro ao classificar despesas")
  }

  return res.json()
}

/** Lista padrões para chips de contexto (cache no backend). */
export async function fetchStrategyTags(): Promise<StrategyTagsListResponse> {
  const res = await fetch(`${API_BASE}/strategy-tags`, { method: "GET" })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao carregar tags de estratégia")
  }
  return res.json()
}

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

  const res = await fetch(`${API_BASE}/simulations`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    if (res.status === 403 && raw && typeof raw === "object" && "code" in raw) {
      throw parsePlgErrorPayload(res.status, raw)
    }
    throwApiFailure(res, raw, "Erro ao calcular simulação")
  }

  return res.json()
}

/** Texto integral do artigo (chunks agregados no backend). id = article_id da linha do chunk. */
export async function fetchLawArticle(chunkArticleId: string): Promise<LawArticleResponse> {
  const enc = encodeURIComponent(chunkArticleId)
  const res = await fetch(`${API_BASE}/law/articles/${enc}`)
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao carregar artigo")
  }
  return res.json()
}

/** Ancoragem ao PDF oficial (LC68). Requer plano Pro/Premium e chunk com pdf_page na ingestão. */
export async function fetchLawPdfAnchor(
  chunkArticleId: string,
  token: string,
  userId: string,
  plan: string,
): Promise<LawPdfAnchorResponse> {
  const enc = encodeURIComponent(chunkArticleId)
  const res = await fetch(`${API_BASE}/law/articles/${enc}/pdf-anchor`, {
    headers: {
      ...authHeaders(token, userId),
      ...tribiaPlanHeader(plan),
    },
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao carregar ancoragem PDF")
  }
  return res.json()
}

export { formatBRL, formatPct, formatPctFraction } from "@/lib/format-money"

// --- Histórico de simulações (persistência no Supabase via API Go) ---

export async function saveSimulationRecord(
  token: string,
  userId: string,
  payload: SimulationRecordCreatePayload,
): Promise<SimulationRecordCreateResponse> {
  const res = await fetch(`${API_BASE}/simulation-records`, {
    method: "POST",
    headers: authHeaders(token, userId, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao salvar histórico")
  }
  return res.json()
}

export async function listSimulationRecords(
  token: string,
  userId: string,
  limit = 20,
): Promise<SimulationRecordSummary[]> {
  const q = new URLSearchParams({ limit: String(limit) })
  const res = await fetch(`${API_BASE}/simulation-records?${q}`, {
    headers: authHeaders(token, userId),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao listar histórico")
  }
  return res.json()
}

export async function getSimulationRecord(
  token: string,
  userId: string,
  id: string,
): Promise<SimulationRecordDetailResponse> {
  const res = await fetch(`${API_BASE}/simulation-records/${encodeURIComponent(id)}`, {
    headers: authHeaders(token, userId),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao carregar simulação")
  }
  return res.json()
}

/** Baixa o PDF de diagnóstico gerado no backend (GET /simulation-records/{id}/report). */
export async function downloadSimulationReport(
  token: string,
  userId: string,
  id: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/simulation-records/${encodeURIComponent(id)}/report`,
    { headers: authHeaders(token, userId) },
  )
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao baixar diagnóstico")
  }
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `Diagnostico_Reforma_Tributaria_${id.slice(0, 8)}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

// --- Templates de Empresa ---

export async function listCompanies(
  token: string,
  userId: string,
  plan?: string,
): Promise<CompanyTemplate[]> {
  const res = await fetch(`${API_BASE}/companies`, {
    headers: authHeaders(token, userId, plan ? tribiaPlanHeader(plan) : undefined),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao listar empresas")
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
  const res = await fetch(`${API_BASE}/companies`, {
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
    if (res.status === 403 && raw && typeof raw === "object" && "code" in raw) {
      throw parsePlgErrorPayload(res.status, raw)
    }
    throwApiFailure(res, raw, "Erro ao criar empresa")
  }
  return res.json()
}

export async function deleteCompany(
  token: string,
  userId: string,
  id: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/companies/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(token, userId),
  })
  if (!res.ok && res.status !== 204) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiFailure(res, raw, "Erro ao excluir empresa")
  }
}
