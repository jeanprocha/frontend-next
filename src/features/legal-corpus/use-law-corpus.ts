"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchLawCorpus, queryKeys } from "@/lib/api"
import type { LawCorpusResponse } from "@/lib/api/legal"
import type { FiscalLawChangelogPayload } from "@/lib/fiscal-law-changelog"
import { corpusToChangelogPayload, staticCorpusFallback } from "./corpus-fallback"

/**
 * W1 (docs/plano-evolucao-tribia.md): `GET /law/corpus` ainda não existe no
 * backend Go. Ativação de UMA linha quando a rota entregar — o resto do hook
 * (fallback, query key, shape) já está pronto.
 */
const LAW_CORPUS_API_ENABLED = false

export interface UseLawCorpusResult {
  corpus: LawCorpusResponse
  changelog: FiscalLawChangelogPayload
  /** true só quando os dados vieram da API real (W1); false = fallback estático de sempre. */
  isLive: boolean
}

export function useLawCorpus(): UseLawCorpusResult {
  const { data } = useQuery({
    queryKey: queryKeys.lawCorpus.all,
    queryFn: fetchLawCorpus,
    enabled: LAW_CORPUS_API_ENABLED,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const corpus = data ?? staticCorpusFallback()
  return {
    corpus,
    changelog: corpusToChangelogPayload(corpus),
    isLive: Boolean(data),
  }
}
