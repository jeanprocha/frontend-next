"use client"

import { useTribiaPlanContext } from "./plan-provider"
import { useCapabilityOverride } from "./capability-provider"
import type { CapabilityName, TribiaPlgCapabilities, TribiaPlgTier } from "./capabilities"

/**
 * Tier PLG: `publicMetadata.tribia_plan` no Clerk (free|pro|premium), com fallback
 * a `NEXT_PUBLIC_TRIBIA_PLG_TIER` em desenvolvimento.
 */
export function useTribiaPlgTier(): TribiaPlgTier {
  return useTribiaPlanContext().tier
}

export function usePlgCapabilities(): TribiaPlgCapabilities {
  const override = useCapabilityOverride()
  const plan = useTribiaPlanContext()
  return override ?? plan.capabilities
}

export function useCapability(cap: CapabilityName): boolean {
  return usePlgCapabilities()[cap]
}

export function useTribiaBranding(): {
  brandingLogoUrl: string | null
  brandingOrgName: string | null
} {
  const { brandingLogoUrl, brandingOrgName } = useTribiaPlanContext()
  return { brandingLogoUrl, brandingOrgName }
}
