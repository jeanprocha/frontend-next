// Contexto mutável de runtime (FE-1): o hook público (use-simulation-pipeline.ts)
// regista getToken/userId/plan/queryClient a cada render — os passos assíncronos
// (steps.ts) e o executor de comandos (machine-store.ts) sempre leem o valor
// mais recente daqui, nunca capturam uma closure obsoleta.
//
// FE-3 (PR 3b): reportBrand/discoveredTags saíram daqui — esses dados agora
// viajam explicitamente pelo `acc` entre passos e pelo payload do comando
// "persist" (machine-types.ts), não por um canal mutável de módulo.
import type { QueryClient } from "@tanstack/react-query"
import type { StepCtx } from "./machine-types"

interface MutableRuntimeCtx {
  getToken(): Promise<string | null>
  userId: string | null | undefined
  plan: string
  queryClient: QueryClient | null
}

const ctx: MutableRuntimeCtx = {
  getToken: async () => null,
  userId: null,
  plan: "free",
  queryClient: null,
}

export function setRuntimeCtx(next: {
  getToken(): Promise<string | null>
  userId: string | null | undefined
  plan: string
  queryClient: QueryClient
}): void {
  ctx.getToken = next.getToken
  ctx.userId = next.userId
  ctx.plan = next.plan
  ctx.queryClient = next.queryClient
}

/** Lançado só se algum passo executar antes do hook montar/registar o ctx (não deveria acontecer). */
export function getStepCtx(): StepCtx {
  if (!ctx.queryClient) {
    throw new Error("[TribIA] Runtime da máquina de simulação usado antes de useSimulationPipeline montar.")
  }
  return {
    getToken: ctx.getToken,
    userId: ctx.userId,
    plan: ctx.plan,
    queryClient: ctx.queryClient,
  }
}
