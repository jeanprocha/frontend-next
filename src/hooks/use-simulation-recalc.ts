"use client"

/**
 * use-simulation-recalc.ts — Recálculo isolado após override do consultor (3.4.1).
 *
 * Mantra "IA explica; Go calcula":
 *   - Nenhum cálculo fiscal aqui; só monta o payload com os valores efectivos
 *     (via getEffectiveExpenseSimulationFields) e delega ao motor Go via POST /simulations.
 *   - Não reclassifica serviços nem despesas: usa service_classifications persistido.
 *   - ai_metadata original do batch é preservado (overrides não reexecutam RAG).
 *
 * Fluxo:
 *   O consultor aplica N overrides → pendingSimulationSync = true.
 *   Clica "Recalcular impacto" → recalculate() → POST → markSimulationSynced().
 *   Debounce opcional: cancelado se novo override chegar antes dos 800ms.
 */

import { useCallback, useEffect, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "@clerk/nextjs"
import { simulate, type ClassifySimulatePlgOpts } from "@/lib/api"
import { getEffectiveExpenseSimulationFields } from "@/lib/classification-effective"
import { useTaxStore, isImobiliarioRegime } from "@/store/useTaxStore"
import { useTribiaPlgTier } from "@/hooks/use-tribia-plg-tier"
import { saveSimulationRecord } from "@/lib/api"

const DEBOUNCE_MS = 800

export function useSimulationRecalc() {
  const { getToken, userId } = useAuth()
  const plgTier = useTribiaPlgTier()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Garante que o timer é cancelado se o componente desmontar enquanto o debounce
  // está pendente — evita POST fantasma e escrita no store após unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const {
    year,
    companyContext,
    companyRegime,
    imobiliarioRedutorAjusteBrl,
    services,
    expenses,
    results,
    markSimulationSynced,
  } = useTaxStore()

  const mutation = useMutation({
    mutationKey: ["tax-simulation-recalc"],
    mutationFn: async () => {
      if (!results || results.mode !== "form") {
        throw new Error("Sem resultados de simulação para recalcular.")
      }

      const token = await getToken()
      const plgAuth: ClassifySimulatePlgOpts | null =
        token && userId ? { token, userId, plan: plgTier } : null

      const { classifications, service_classifications } = results
      const redutorTrim = imobiliarioRedutorAjusteBrl?.trim() ?? ""

      const svcClassMap = new Map(
        (service_classifications ?? []).map((c) => [c.client_id ?? c.description, c]),
      )
      const expClassMap = new Map(
        classifications.map((c) => [c.client_id ?? c.description, c]),
      )

      return simulate(
        {
          year,
          ...(companyRegime !== "regular" ? { company_regime: companyRegime } : {}),
          company_context: companyContext,
          ...(isImobiliarioRegime(companyRegime) && redutorTrim !== ""
            ? { imobiliario_redutor_ajuste_brl: redutorTrim }
            : {}),
          services: services.map((s) => ({
            description: s.description,
            amount: s.amount,
            iss_rate: s.iss_rate,
            // Regime do serviço a partir das classificações IA persistidas.
            // Fallback "padrao" se o registo não tiver service_classifications.
            regime_type: svcClassMap.get(s.id)?.regime_type ?? "padrao",
          })),
          expenses: expenses.map((e) => {
            const c = expClassMap.get(e.id) ?? expClassMap.get(e.description) ?? null
            const eff = getEffectiveExpenseSimulationFields(c)
            return {
              description: e.description,
              amount: e.amount,
              is_eligible: eff.is_eligible,
              regime_type: eff.regime_type,
            }
          }),
        },
        plgAuth,
      )
    },

    onSuccess: async (newSimulation) => {
      markSimulationSynced(newSimulation)

      // Gravar histórico após recálculo (uma gravação, não uma por override).
      if (!userId || !results || results.mode !== "form") return
      try {
        const token = await getToken()
        if (!token) return
        await saveSimulationRecord(token, userId, {
          company_context: companyContext,
          company_regime: companyRegime ?? "regular",
          year,
          simulation: { ...newSimulation, company_regime: companyRegime ?? "regular" },
          services: services.map((s) => ({
            description: s.description,
            amount: s.amount,
            iss_rate: s.iss_rate,
          })),
          // Mesma lógica de precedência usada em simulate() — getEffectiveExpenseSimulationFields
          // aplica Humano > IA e faz fallback por description. Garante que o histórico espelha
          // exactamente o que o motor Go calculou, inclusive em despesas sem client_id.
          expenses: expenses.map((e) => {
            const cls =
              results.classifications.find((c) => c.client_id === e.id) ??
              results.classifications.find((c) => c.description === e.description) ??
              null
            const eff = getEffectiveExpenseSimulationFields(cls)
            return {
              description: e.description,
              amount: e.amount,
              is_eligible: eff.is_eligible,
            }
          }),
          classifications: results.classifications,
          classifications_snapshot: {
            snapshot_version: 1,
            service_classifications: results.service_classifications,
            expense_classifications: results.classifications,
            ai_metadata: results.ai_metadata ?? undefined,
          },
        })
      } catch {
        // Falha silenciosa no histórico não deve interromper o fluxo do consultor.
      }
    },
  })

  /** Disparo imediato do recálculo (via CTA "Recalcular impacto"). */
  const recalculate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    mutation.mutate()
  }, [mutation])

  /**
   * Recálculo com debounce 800ms — cancelado se chamado novamente antes do tick.
   * Usar ao encadear overrides rápidos para evitar N POSTs.
   */
  const recalculateDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      mutation.mutate()
    }, DEBOUNCE_MS)
  }, [mutation])

  /** Cancela debounce em curso sem disparar POST. */
  const cancelDebounce = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  return {
    recalculate,
    recalculateDebounced,
    cancelDebounce,
    isRecalculating: mutation.isPending,
    recalcError: mutation.error,
  }
}
