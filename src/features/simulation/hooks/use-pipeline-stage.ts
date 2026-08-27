"use client"

import { useMemo } from "react"
import { isFilledLine } from "@/lib/simulation-line-helpers"
import type { PipelineUiStage } from "../machine/machine-types"
import type { FormExpense, FormService } from "@/types/api"

/**
 * Alias do vocabulário de estágio da máquina (FE-3, PR 3d) — antes a UI tinha
 * uma union PRÓPRIA (`"context" | "classification" | "simulation" |
 * "verdict"`), derivada de booleans achatados sem relação com o estado real
 * do pipeline; `classifying`/`calculating` colapsavam ambos num único
 * "simulation" durante todo o run. Agora é o mesmo tipo que cada `Step` do
 * registry declara em `uiStage` — um passo novo aparece na UI só ao
 * registrar `{id, run, uiStage}` em step-registry.ts (PR 3b), sem tocar aqui.
 */
export type PipelineStage = PipelineUiStage

export const PIPELINE_STAGE_LABEL_PT: Record<PipelineStage, string> = {
  context: "Contexto",
  classification: "Classificação",
  simulation: "Simulação",
  verdict: "Veredito",
}

export type MachineStatus = "idle" | "running" | "ready"

export interface UsePipelineStageInput {
  machineStatus: MachineStatus
  /** `uiStage` do passo em execução (`null` fora de `running`) — ver use-simulation-pipeline.ts. */
  runningUiStage: PipelineUiStage | null
  services: FormService[]
  expenses: FormExpense[]
}

/**
 * Precedência: veredito (`ready`) > o `uiStage` do passo real em execução
 * (`running`, com fallback "simulation" — impossível na prática, rede de
 * segurança se um passo do registry esquecer o `uiStage`) > classificação
 * (form com ≥1 receita e ≥1 despesa preenchidas) > contexto.
 */
export function resolvePipelineStage(input: UsePipelineStageInput): PipelineStage {
  const { machineStatus, runningUiStage, services, expenses } = input

  if (machineStatus === "ready") return "verdict"
  if (machineStatus === "running") return runningUiStage ?? "simulation"

  const nSvc = services.filter(isFilledLine).length
  const nExp = expenses.filter(isFilledLine).length
  if (nSvc >= 1 && nExp >= 1) return "classification"

  return "context"
}

export function usePipelineStage(input: UsePipelineStageInput): PipelineStage {
  const { machineStatus, runningUiStage, services, expenses } = input
  return useMemo(
    () => resolvePipelineStage({ machineStatus, runningUiStage, services, expenses }),
    [machineStatus, runningUiStage, services, expenses],
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
