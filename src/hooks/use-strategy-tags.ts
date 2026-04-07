"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchStrategyTags } from "@/lib/api"
import { dedupeStrategyTagsByPattern, getFallbackStrategyTags } from "@/lib/strategy-tags-match"
import type { StrategyTag } from "@/types/api"

export function useStrategyTags(): {
  tags: StrategyTag[]
  isLoading: boolean
  isError: boolean
  isFetched: boolean
} {
  const q = useQuery({
    queryKey: ["strategy-tags"],
    queryFn: fetchStrategyTags,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })

  const tags = useMemo((): StrategyTag[] => {
    if (q.data?.tags != null && q.data.tags.length > 0) {
      return dedupeStrategyTagsByPattern(q.data.tags)
    }
    return dedupeStrategyTagsByPattern(getFallbackStrategyTags())
  }, [q.data])

  return {
    tags,
    isLoading: q.isLoading,
    isError: q.isError,
    isFetched: q.isFetched,
  }
}
