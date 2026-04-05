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
      // Passo 1: IA classifica serviços e despesas em paralelo via RAG + LLM (LC 68/2024).
      // Serviços → extrai regime_type (determina alíquota efetiva CBS/IBS no motor Go).
      // Despesas → extrai is_eligible + regime_type (para créditos e badge de regime).
      const [svcClassResult, expClassResult] = await Promise.all([
        classifyBatch(
          services.map((s) => ({ description: s.description, context: companyContext })),
        ),
        classifyBatch(
          expenses.map((e) => ({ description: e.description, context: companyContext })),
        ),
      ])

      const svcClassMap = new Map(svcClassResult.results.map((r) => [r.description, r]))
      const expClassMap = new Map(expClassResult.results.map((r) => [r.description, r]))

      // Passo 2: motor Go calcula impacto com regime_type por serviço e créditos corretos
      const simResult = await simulate({
        year,
        services: services.map((s) => ({
          description: s.description,
          amount: s.amount,
          iss_rate: s.iss_rate,
          regime_type: svcClassMap.get(s.description)?.regime_type ?? "padrao",
        })),
        expenses: expenses.map((e) => ({
          description: e.description,
          amount: e.amount,
          is_eligible: expClassMap.get(e.description)?.is_eligible ?? false,
          regime_type: expClassMap.get(e.description)?.regime_type ?? "padrao",
        })),
      })

      return {
        simulation: simResult,
        classifications: expClassResult.results,
        expenses,
      }
    },
    onSuccess: async (data, variables) => {
      setFormResults({
        mode: "form",
        ...data,
        meta: {
          createdAt: new Date().toISOString(),
          companyContext: variables.companyContext,
          year: variables.year,
        },
      })

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
