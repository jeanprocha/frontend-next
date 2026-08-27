"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchLawCorpus, queryKeys } from "@/lib/api"
import type { LawCorpusResponse } from "@/lib/api/legal"
import type { FiscalLawChangelogPayload } from "@/lib/fiscal-law-changelog"
import { corpusToChangelogPayload, staticCorpusFallback } from "./corpus-fallback"

/**
 * W1/PR 8 (docs/plano-evolucao-tribia.md): `GET /law/corpus` está em produção
 * desde a PR 4 (verificado ao vivo — 200, 377 trechos, data-base 22/07/2024).
 * Ligado; `isLive` cai para false e o hook volta ao fallback estático se a
 * chamada falhar ou ainda não tiver resolvido (`data` undefined).
 */
const LAW_CORPUS_API_ENABLED = true

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
