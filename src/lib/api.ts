import type {
  BatchClassificationResponse,
  CompanyCreatePayload,
  CompanyTemplate,
  SimulationRecordCreatePayload,
  SimulationRecordCreateResponse,
  SimulationRecordDetailResponse,
  SimulationRecordSummary,
  SimulationRequest,
  SimulationResponse,
} from "@/types/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

function bearerHeaders(token: string, extra?: Record<string, string>): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  }
}

// classifyBatch envia uma lista de descrições de despesas para o endpoint
// POST /credit-classifications/batch, que usa RAG + LLM para determinar
// elegibilidade a crédito de IBS/CBS conforme a LC 68/2024.
export async function classifyBatch(
  expenses: { description: string; context?: string; client_id?: string }[],
  maxConcurrency = 5,
): Promise<BatchClassificationResponse> {
  const res = await fetch(`${API_BASE}/credit-classifications/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expenses, max_concurrency: maxConcurrency }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? "Erro ao classificar despesas")
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
): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/simulations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? "Erro ao calcular simulação")
  }

  return res.json()
}

// formatBRL converte uma string decimal ("1234.50") para moeda brasileira.
export function formatBRL(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "R$ —"
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// formatPct formata um valor já em percentual ("92.98" → "92.9%").
// O motor Go envia delta_pct já como percentual sobre o líquido atual (ex: -10.5 = -10,5%).
export function formatPct(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "—"
  return `${num.toFixed(1)}%`
}

// formatPctFraction converte fração decimal para percentual ("0.05" → "5.0%").
// Usar para ISS rates e confidence scores que chegam como frações (0–1).
export function formatPctFraction(value: string | number): string {
  const num = typeof value === "number" ? value : parseFloat(value)
  if (isNaN(num)) return "—"
  return `${(num * 100).toFixed(1)}%`
}

// --- Histórico de simulações (persistência no Supabase via API Go) ---

export async function saveSimulationRecord(
  token: string,
  payload: SimulationRecordCreatePayload,
): Promise<SimulationRecordCreateResponse> {
  const res = await fetch(`${API_BASE}/simulation-records`, {
    method: "POST",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? "Erro ao salvar histórico")
  }
  return res.json()
}

export async function listSimulationRecords(
  token: string,
  limit = 20,
): Promise<SimulationRecordSummary[]> {
  const q = new URLSearchParams({ limit: String(limit) })
  const res = await fetch(`${API_BASE}/simulation-records?${q}`, {
    headers: bearerHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? "Erro ao listar histórico")
  }
  return res.json()
}

export async function getSimulationRecord(
  token: string,
  id: string,
): Promise<SimulationRecordDetailResponse> {
  const res = await fetch(`${API_BASE}/simulation-records/${encodeURIComponent(id)}`, {
    headers: bearerHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? "Erro ao carregar simulação")
  }
  return res.json()
}

/** Baixa o PDF de diagnóstico gerado no backend (GET /simulation-records/{id}/report). */
export async function downloadSimulationReport(token: string, id: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/simulation-records/${encodeURIComponent(id)}/report`,
    { headers: bearerHeaders(token) },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? "Erro ao baixar diagnóstico")
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

export async function listCompanies(token: string): Promise<CompanyTemplate[]> {
  const res = await fetch(`${API_BASE}/companies`, {
    headers: bearerHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? "Erro ao listar empresas")
  }
  const data = await res.json()
  return (data ?? []).map((c: CompanyTemplate) => ({
    ...c,
    default_services: Array.isArray(c.default_services) ? c.default_services : [],
  }))
}

export async function createCompany(
  token: string,
  payload: CompanyCreatePayload,
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/companies`, {
    method: "POST",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      ...payload,
      default_services: payload.default_services,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? "Erro ao criar empresa")
  }
  return res.json()
}

export async function deleteCompany(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/companies/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  })
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? "Erro ao excluir empresa")
  }
}
