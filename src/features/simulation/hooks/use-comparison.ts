"use client"

import { useCallback, useState } from "react"
import type { PersistedResults } from "@/lib/persisted-results"

function clonePersistedResults(r: PersistedResults): PersistedResults {
  return structuredClone(r)
}

export function useComparison() {
  const [baseline, setBaseline] = useState<PersistedResults | null>(null)

  const isComparing = baseline !== null

  const startComparison = useCallback((current: PersistedResults) => {
    if (current.mode !== "form") return
    setBaseline(clonePersistedResults(current))
  }, [])

  const clearComparison = useCallback(() => {
    setBaseline(null)
  }, [])

  const replaceBaselineWith = useCallback((current: PersistedResults) => {
    if (current.mode !== "form") return
    setBaseline(clonePersistedResults(current))
  }, [])

  return {
    baseline,
    isComparing,
    startComparison,
    clearComparison,
    replaceBaselineWith,
  }
}
