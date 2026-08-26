import type { TribiaPlgTier, TribiaPlgCapabilities } from "@/lib/tribia-plg-flags"

export type { TribiaPlgTier, TribiaPlgCapabilities, CapabilityName } from "@/lib/tribia-plg-flags"

export function getPlgCapabilities(tier: TribiaPlgTier): TribiaPlgCapabilities {
  const isPro = tier === "pro" || tier === "premium"
  const isPremium = tier === "premium"
  return {
    rayxFull: isPro,
    boardReadyUnlocked: isPro,
    historyRichPreview: isPro,
    compareAB: isPro,
    legalOpinionTab: isPremium,
    whiteLabelExport: isPremium,
    collectiveIntel: isPremium,
    complianceRadar: isPremium,
    freeWatermark: tier === "free",
    transitionFullChart: isPro,
    transitionFocusYear: isPro,
    transitionAuditFactors: isPro,
    transitionDynamicInsights: isPro,
    pdfLegislationPro: isPro,
    privacyWorkspace: isPro,
  }
}

/**
 * Capacidades do dossié público (/report/[id]): gating já ocorreu na geração
 * do link (plano de quem gerou), então o dossié renderiza com tudo aberto —
 * excepto freeWatermark, que já sai `false` naturalmente (tier "premium").
 */
export const PUBLIC_REPORT_CAPABILITIES: TribiaPlgCapabilities = getPlgCapabilities("premium")
