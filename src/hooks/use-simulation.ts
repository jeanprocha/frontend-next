"use client"

import { useAuth } from "@clerk/nextjs"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { classifyBatch, saveSimulationRecord, simulate } from "@/lib/api"
import { useTaxStore } from "@/store/useTaxStore"
import type { FormExpense, FormService } from "@/types/api"

// Payload recebido via mutate() — não acoplado ao Zustand internamente,
// o que torna o hook testável e reutilizável em outros contextos.
export interface SimulationPayload {
  year: number
  services: FormService[]
  expenses: FormExpense[]
  companyContext: string
}

export function useSimulationMutation() {
  const { setResults: setFormResults } = useTaxStore()
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ["tax-simulation"],
    mutationFn: async ({ year, services, expenses, companyContext }: SimulationPayload) => {
      // Passo 1: IA classifica despesas via RAG + LLM (LC 68/2024)
      const batchResult = await classifyBatch(
        expenses.map((e) => ({ description: e.description, context: companyContext })),
      )
      const classMap = new Map(batchResult.results.map((r) => [r.description, r]))

      // Passo 2: motor Go calcula impacto com créditos corretos injetados
      const simResult = await simulate({
        year,
        services: services.map((s) => ({
          description: s.description,
          amount: s.amount,
          iss_rate: s.iss_rate,
        })),
        expenses: expenses.map((e) => ({
          description: e.description,
          amount: e.amount,
          is_eligible: classMap.get(e.description)?.is_eligible ?? false,
        })),
      })

      return {
        simulation: simResult,
        classifications: batchResult.results,
        expenses,
      }
    },
    onSuccess: async (data, variables) => {
      setFormResults({ mode: "form", ...data })

      if (!userId) return

      try {
        await saveSimulationRecord({
          user_id: userId,
          company_context: variables.companyContext,
          year: variables.year,
          simulation: data.simulation,
          services: variables.services.map((s) => ({
            description: s.description,
            amount: s.amount,
            iss_rate: s.iss_rate,
          })),
          expenses: variables.expenses.map((e) => ({
            description: e.description,
            amount: e.amount,
            is_eligible:
              data.classifications.find((c) => c.description === e.description)
                ?.is_eligible ?? false,
          })),
          classifications: data.classifications,
        })
        await queryClient.invalidateQueries({
          queryKey: ["simulation-records", userId],
        })
      } catch (e) {
        console.error("[TribIA] Falha ao persistir histórico no servidor:", e)
      }
    },
  })
}
