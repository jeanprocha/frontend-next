import { useTribiaPlanContext } from "@/components/tribia/tribia-plan-provider"
import type { TribiaPlgTier, TribiaPlgCapabilities } from "@/lib/tribia-plg-flags"

export type { TribiaPlgTier, TribiaPlgCapabilities }

/**
 * Tier PLG: `publicMetadata.tribia_plan` no Clerk (free|pro|premium), com fallback
 * a `NEXT_PUBLIC_TRIBIA_PLG_TIER` em desenvolvimento.
 */
export function useTribiaPlgTier(): TribiaPlgTier {
  return useTribiaPlanContext().tier
}

export function usePlgCapabilities(): TribiaPlgCapabilities {
  return useTribiaPlanContext().capabilities
}

export function useRayxFullAccess(): boolean {
  return useTribiaPlanContext().capabilities.rayxFull
}

export function useTribiaBranding(): {
  brandingLogoUrl: string | null
  brandingOrgName: string | null
} {
  const { brandingLogoUrl, brandingOrgName } = useTribiaPlanContext()
  return { brandingLogoUrl, brandingOrgName }
}
