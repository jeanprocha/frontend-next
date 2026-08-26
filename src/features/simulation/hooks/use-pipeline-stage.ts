"use client"

import { useMemo } from "react"
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

export const PIPELINE_STAGES_ORDERED: readonly PipelineStage[] = [
  "context",
  "classification",
  "simulation",
  "verdict",
] as const

export interface UsePipelineStageInput {
  loading: boolean
  /** Simulação completa (form com motor executado). */
  hasFormSimulationResults: boolean
  /** Vista de resultados só com classificação CSV (sem simulação tributária). */
  hasCsvClassificationResults: boolean
  /** Parse ou classifyBatch em curso no fluxo CSV. */
  csvProcessing: boolean
  inputMode: "form" | "csv"
  services: FormService[]
  expenses: FormExpense[]
}

function validLine(row: { description?: string; amount?: string }): boolean {
  return Boolean(row.description?.trim() && row.amount?.trim())
}

/**
 * Precedência: veredito (só form simulado) > simulação (mutation ou CSV a processar)
 * > classificação (form com linhas ou resultados CSV) > contexto.
 */
export function resolvePipelineStage(input: UsePipelineStageInput): PipelineStage {
  const {
    loading,
    hasFormSimulationResults,
    hasCsvClassificationResults,
    csvProcessing,
    inputMode,
    services,
    expenses,
  } = input

  if (hasFormSimulationResults && !loading) return "verdict"
  if (loading || csvProcessing) return "simulation"

  if (hasCsvClassificationResults && !loading) return "classification"

  if (inputMode !== "form") return "context"

  const nSvc = services.filter(validLine).length
  const nExp = expenses.filter(validLine).length
  if (nSvc >= 1 && nExp >= 1) return "classification"

  return "context"
}

export function usePipelineStage(input: UsePipelineStageInput): PipelineStage {
  const {
    loading,
    hasFormSimulationResults,
    hasCsvClassificationResults,
    csvProcessing,
    inputMode,
    services,
    expenses,
  } = input
  return useMemo(
    () =>
      resolvePipelineStage({
        loading,
        hasFormSimulationResults,
        hasCsvClassificationResults,
        csvProcessing,
        inputMode,
        services,
        expenses,
      }),
    [
      loading,
      hasFormSimulationResults,
      hasCsvClassificationResults,
      csvProcessing,
      inputMode,
      services,
      expenses,
    ],
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
