// Contexto mutável de runtime (FE-1): o hook público (use-simulation-pipeline.ts)
// regista getToken/userId/plan/queryClient a cada render — os passos assíncronos
// (steps.ts) e o executor de comandos (machine-store.ts) sempre leem o valor
// mais recente daqui, nunca capturam uma closure obsoleta.
import type { QueryClient } from "@tanstack/react-query"
import type { StrategyTag } from "@/types/api"
import type { StepCtx } from "./steps"

interface MutableRuntimeCtx {
  getToken(): Promise<string | null>
  userId: string | null | undefined
  plan: string
  queryClient: QueryClient | null
  reportBrand: { logo_url?: string | null; org_name?: string | null } | null
  discoveredTags: StrategyTag[] | undefined
}

const ctx: MutableRuntimeCtx = {
  getToken: async () => null,
  userId: null,
  plan: "free",
  queryClient: null,
  reportBrand: null,
  discoveredTags: undefined,
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
    reportBrand: ctx.reportBrand,
    discoveredTags: ctx.discoveredTags,
  }
}

export function setDossierReportBrand(reportBrand: MutableRuntimeCtx["reportBrand"]): void {
  ctx.reportBrand = reportBrand
}

export function setLastDiscoveredTags(tags: StrategyTag[] | undefined): void {
  ctx.discoveredTags = tags
}
