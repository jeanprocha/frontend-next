"use client"

// Extraído verbatim de app/dashboard/companies/page.tsx (FE-4, PR 4c —
// move puro). Mesma query key usada em command-menu.tsx e
// simulation-form.tsx — dedupe via TanStack Query, não via hook
// compartilhado (nenhum dos dois pode importar features/portfolio).
import { useAuth } from "@/lib/auth-client"
import { useQuery } from "@tanstack/react-query"
import { listCompanies, queryKeys } from "@/lib/api"
import { useTribiaPlgTier } from "@/features/plg"

export function usePortfolioCompanies() {
  const { userId, getToken } = useAuth()
  const plgTierList = useTribiaPlgTier()

  return useQuery({
    queryKey: queryKeys.companies.list(userId, plgTierList),
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return listCompanies(token, userId, plgTierList)
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
}
