export type TribiaPlgTier = "free" | "pro" | "premium"

/** Capacidades derivadas do plano (feature flags PLG). */
export interface TribiaPlgCapabilities {
  rayxFull: boolean
  boardReadyUnlocked: boolean
  historyRichPreview: boolean
  compareAB: boolean
  /** Aba / bloco de parecer jurídico assistido */
  legalOpinionTab: boolean
  /** Board-Ready e impressão sem marca TribIA / com marca do cliente */
  whiteLabelExport: boolean
  /** Radar de compliance + tendências agregadas (Premium) */
  collectiveIntel: boolean
  complianceRadar: boolean
  /** Watermark explícito Free em modo apresentação e impressão */
  freeWatermark: boolean
}

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
  }
}
