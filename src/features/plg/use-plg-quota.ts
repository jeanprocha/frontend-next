"use client"

import { useAuth } from "@/lib/auth-client"
import { useQuery } from "@tanstack/react-query"
import { fetchPlgQuota, queryKeys } from "@/lib/api"
import { useTribiaPlgTier } from "./use-capability"

export function usePlgQuota() {
  const { userId, isLoaded, getToken } = useAuth()
  const tier = useTribiaPlgTier()

  return useQuery({
    queryKey: queryKeys.plgQuota.forUser(userId, tier),
    enabled: Boolean(isLoaded && userId),
    staleTime: 30_000,
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return fetchPlgQuota(token, userId, tier)
    },
  })
}
