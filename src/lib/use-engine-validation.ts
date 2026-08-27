"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchEngineValidation, queryKeys } from "@/lib/api"
import type { EngineValidationResponse } from "@/lib/api/engine"

export interface UseEngineValidationResult {
  validation: EngineValidationResponse | undefined
  /** true só quando a resposta chegou E validated é true. */
  isLive: boolean
}

/**
 * W7/B2.3 — GET /engine/validation não tem fallback estático: ao contrário
 * do corpus legal (lib/use-law-corpus.ts), que sempre tem alguma coisa
 * honesta para mostrar (o documento hoje ingerido), um selo de validação do
 * motor não tem forma estática que não seja fabricada — sem resposta ao
 * vivo com validated:true, não existe nada para renderizar (PRODUCT.md).
 * Hook vive em lib/ (não em feature) desde o dia 1 — aprendendo com a
 * promoção de useLawCorpus na PR 10 do W1 (feature→feature é proibido e o
 * lint pega isso na hora assim que qualquer feature além de legal-corpus
 * precisar do dado).
 */
export function useEngineValidation(): UseEngineValidationResult {
  const { data } = useQuery({
    queryKey: queryKeys.engineValidation.all,
    queryFn: fetchEngineValidation,
    staleTime: 5 * 60_000,
    retry: false,
  })

  return {
    validation: data,
    isLive: Boolean(data?.validated),
  }
}
