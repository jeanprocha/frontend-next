"use client"

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react"
import { useUser } from "@clerk/nextjs"
import {
  type TribiaPlgTier,
  getPlgCapabilities,
  type TribiaPlgCapabilities,
} from "@/lib/tribia-plg-flags"

function normalizeTier(raw: unknown): TribiaPlgTier | null {
  if (typeof raw !== "string") return null
  const t = raw.toLowerCase().trim()
  if (t === "free" || t === "pro" || t === "premium") return t
  return null
}

function envFallbackTier(): TribiaPlgTier {
  const raw = (process.env.NEXT_PUBLIC_TRIBIA_PLG_TIER ?? "").toLowerCase().trim()
  return raw === "pro" || raw === "premium" ? raw : "free"
}

type TribiaPlanContextValue = {
  tier: TribiaPlgTier
  capabilities: TribiaPlgCapabilities
  /** Metadados Clerk (white-label): URL de logotipo do cliente, opcional */
  brandingLogoUrl: string | null
  brandingOrgName: string | null
  isLoaded: boolean
}

const TribiaPlanContext = createContext<TribiaPlanContextValue | null>(null)

export function TribiaPlanProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser()

  const value = useMemo((): TribiaPlanContextValue => {
    const envTier = envFallbackTier()
    let tier: TribiaPlgTier = envTier
    let brandingLogoUrl: string | null = null
    let brandingOrgName: string | null = null

    if (isLoaded && user?.publicMetadata) {
      const meta = user.publicMetadata as Record<string, unknown>
      const fromMeta = normalizeTier(meta.tribia_plan)
      if (fromMeta) tier = fromMeta
      const logo = meta.branding_logo_url
      const org = meta.branding_org_name
      if (typeof logo === "string" && logo.trim()) brandingLogoUrl = logo.trim()
      if (typeof org === "string" && org.trim()) brandingOrgName = org.trim()
    }

    return {
      tier,
      capabilities: getPlgCapabilities(tier),
      brandingLogoUrl,
      brandingOrgName,
      isLoaded,
    }
  }, [isLoaded, user])

  return (
    <TribiaPlanContext.Provider value={value}>
      {children}
    </TribiaPlanContext.Provider>
  )
}

export function useTribiaPlanContext(): TribiaPlanContextValue {
  const ctx = useContext(TribiaPlanContext)
  if (!ctx) {
    const tier = envFallbackTier()
    return {
      tier,
      capabilities: getPlgCapabilities(tier),
      brandingLogoUrl: null,
      brandingOrgName: null,
      isLoaded: true,
    }
  }
  return ctx
}
