// Só tipos aqui — camada base (lib/) não pode importar de features/ (regra 1 do
// lint de fronteira). A implementação de getPlgCapabilities (com os literais de
// tier) vive em features/plg/capabilities.ts, que importa estes tipos.

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
  /**
   * Watermark explícito Free em modo apresentação e impressão. Polaridade
   * invertida face às restantes flags de propósito — aqui capability
   * significa "aplica-se ao plano actual" (activa em free), não "desbloqueado
   * pelo plano". Mantida assim deliberadamente: renomear quebraria a leitura
   * directa "freeWatermark = mostrar marca d'água Free" nos call sites.
   */
  freeWatermark: boolean
  /** Gráfico de transição completo (Pro); Free usa sparkline */
  transitionFullChart: boolean
  /** Selector 2026–2033 sincronizado com cards (Pro) */
  transitionFocusYear: boolean
  /** Painel de fatores / memória de cálculo (Pro) */
  transitionAuditFactors: boolean
  /** Texto comparativo ano vs marcos (Pro) */
  transitionDynamicInsights: boolean
  /** Ancoragem PDF (PRO): Raio-X completo ou Board-Ready desbloqueado. */
  pdfLegislationPro: boolean
  /** Workspace de privacidade (PrivacyTrustBanner) — fora do plano Free. */
  privacyWorkspace: boolean
}

export type CapabilityName = keyof TribiaPlgCapabilities
