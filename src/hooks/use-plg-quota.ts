"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { fetchPlgQuota } from "@/lib/api"
import { useTribiaPlgTier } from "@/hooks/use-tribia-plg-tier"

export function usePlgQuota() {
  const { userId, isLoaded, getToken } = useAuth()
  const tier = useTribiaPlgTier()

  return useQuery({
    queryKey: ["plg-quota", userId, tier],
    enabled: Boolean(isLoaded && userId),
    staleTime: 30_000,
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return fetchPlgQuota(token, userId, tier)
    },
  })
}
