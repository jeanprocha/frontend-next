"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchStrategyTags } from "@/lib/api"
import { getFallbackStrategyTags } from "@/lib/strategy-tags-match"
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
      return q.data.tags
    }
    return getFallbackStrategyTags()
  }, [q.data])

  return {
    tags,
    isLoading: q.isLoading,
    isError: q.isError,
    isFetched: q.isFetched,
  }
}
