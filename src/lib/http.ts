/** Base URL pública do API Go (Vercel: definir `NEXT_PUBLIC_API_URL` = URL do Railway). */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

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

interface RawErrorBody {
  error?: string
  request_id?: string
  code?: string
  limit?: number
  used?: number
  plan?: string
}

/** Info repassada ao listener PLG (ver `setPlgLimitListener`) num 403 de quota/limite. */
export interface PlgLimitErrorInfo {
  message: string
  code?: string
  status: number
  limit?: number
  used?: number
  plan?: string
  requestId?: string
}

let plgLimitListener: ((info: PlgLimitErrorInfo) => void) | null = null

/**
 * Registra o handler central de 403 PLG (FE-3, PR 3a) — `features/plg` monta
 * o host que abre `PlgUpgradeDialog`. `lib/` não importa `features/plg`
 * (regra de fronteira), então a ligação é por callback, não por import.
 * Passar `null` desregistra.
 */
export function setPlgLimitListener(fn: ((info: PlgLimitErrorInfo) => void) | null): void {
  plgLimitListener = fn
}

/**
 * Interceptor PLG único: todo endpoint chama isto no `!res.ok`. Um 403 com
 * `code` no corpo (quota/limite de plano) usa o fallback "Limite do plano
 * atingido" independentemente do endpoint — antes só classifyBatch/simulate/
 * createCompany tratavam esse caso explicitamente; os demais endpoints
 * ganham o mesmo tratamento aqui (unificação declarada da FE-1).
 */
export function throwApiError(res: Response, raw: unknown, fallback: string): never {
  const o = raw as RawErrorBody
  const isPlgLimit = res.status === 403 && raw !== null && typeof raw === "object" && "code" in raw
  const effectiveFallback = isPlgLimit ? "Limite do plano atingido" : fallback
  const msg = (typeof o?.error === "string" && o.error.trim()) || effectiveFallback
  const requestId =
    typeof o?.request_id === "string" && o.request_id.trim() ? o.request_id.trim() : undefined
  const code = typeof o?.code === "string" ? o.code : undefined
  const limit = typeof o?.limit === "number" ? o.limit : undefined
  const used = typeof o?.used === "number" ? o.used : undefined
  const plan = typeof o?.plan === "string" ? o.plan : undefined

  if (isPlgLimit && plgLimitListener) {
    try {
      plgLimitListener({ message: msg, code, status: res.status, limit, used, plan, requestId })
    } catch {
      // O listener nunca deve mascarar o erro original abaixo.
    }
  }

  throw new ApiError(msg, { requestId, code, status: res.status, limit, used, plan })
}

/** Mensagem e `request_id` para UI (erros de mutação / fetch). */
export function errorDetailsFromUnknown(e: unknown): {
  message: string
  requestId?: string
} {
  if (e instanceof ApiError) return { message: e.message, requestId: e.requestId }
  if (e instanceof Error) return { message: e.message }
  return { message: String(e) }
}

/**
 * Headers para rotas protegidas. Com AUTH_SKIP=true no backend Go, o middleware exige
 * X-User-ID (o JWT sozinho não basta). Em produção com Clerk + JWKS, o header é ignorado
 * na autorização, mas enviar o mesmo sub não prejudica.
 */
export function authHeaders(
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

/** Opções de autenticação/plano para endpoints com gating PLG. */
export interface ClassifySimulatePlgOpts {
  token: string
  userId: string
  plan: string
}
