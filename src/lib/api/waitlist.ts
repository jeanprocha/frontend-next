import { API_BASE, throwApiError, tribiaFetch } from "@/lib/http"
import type { WaitlistJoinResponse } from "@/types/api"

/** POST /waitlist — rota pública (Etapa M/PR 9), sem headers de autenticação. */
export async function joinWaitlist(email: string): Promise<WaitlistJoinResponse> {
  const res = await tribiaFetch(`${API_BASE}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const raw = await res.json().catch(() => ({ error: res.statusText }))
    throwApiError(res, raw, "Erro ao entrar na lista de espera")
  }
  return res.json()
}
