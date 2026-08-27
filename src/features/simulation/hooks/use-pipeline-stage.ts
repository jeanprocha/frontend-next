"use client"

import { useMemo } from "react"
import { isFilledLine } from "@/lib/simulation-line-helpers"
import type { FormExpense, FormService } from "@/types/api"

export type PipelineStage =
  | "context"
  | "classification"
  | "simulation"
  | "verdict"

export const PIPELINE_STAGE_LABEL_PT: Record<PipelineStage, string> = {
  context: "Contexto",
  classification: "Classificação",
  simulation: "Simulação",
  verdict: "Veredito",
}

export interface UsePipelineStageInput {
  loading: boolean
  /** Simulação completa (form com motor executado). */
  hasFormSimulationResults: boolean
  services: FormService[]
  expenses: FormExpense[]
}

/**
 * Precedência: veredito (só form simulado) > simulação (mutation em curso)
 * > classificação (form com ≥1 receita e ≥1 despesa preenchidas) > contexto.
 *
 * FE-3 (PR 3c): perdeu hasCsvClassificationResults/csvProcessing/inputMode —
 * o fork classify-only do CSV morreu (upload agora só popula o form, ver
 * features/import). A derivação a partir da máquina (stepId real em vez de
 * um "simulation" único durante todo o run) é a PR 3d.
 */
export function resolvePipelineStage(input: UsePipelineStageInput): PipelineStage {
  const { loading, hasFormSimulationResults, services, expenses } = input

  if (hasFormSimulationResults && !loading) return "verdict"
  if (loading) return "simulation"

  const nSvc = services.filter(isFilledLine).length
  const nExp = expenses.filter(isFilledLine).length
  if (nSvc >= 1 && nExp >= 1) return "classification"

  return "context"
}

export function usePipelineStage(input: UsePipelineStageInput): PipelineStage {
  const { loading, hasFormSimulationResults, services, expenses } = input
  return useMemo(
    () => resolvePipelineStage({ loading, hasFormSimulationResults, services, expenses }),
    [loading, hasFormSimulationResults, services, expenses],
  )
}

export const PIPELINE_GLOW_POSITION: Record<
  PipelineStage,
  { x: string; y: string }
> = {
  context: { x: "30%", y: "10%" },
  classification: { x: "40%", y: "40%" },
  simulation: { x: "50%", y: "50%" },
  verdict: { x: "80%", y: "30%" },
}
