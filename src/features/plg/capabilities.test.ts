import { describe, expect, it } from "vitest"
import { getPlgCapabilities, PUBLIC_REPORT_CAPABILITIES } from "./capabilities"

// Trava a tabela-verdade das 15 flags por tier — qualquer mudança de
// comportamento (intencional ou não) quebra este teste.
describe("getPlgCapabilities", () => {
  it("free: todas desligadas, excepto freeWatermark", () => {
    expect(getPlgCapabilities("free")).toEqual({
      rayxFull: false,
      boardReadyUnlocked: false,
      historyRichPreview: false,
      compareAB: false,
      legalOpinionTab: false,
      whiteLabelExport: false,
      collectiveIntel: false,
      complianceRadar: false,
      freeWatermark: true,
      transitionFullChart: false,
      transitionFocusYear: false,
      transitionAuditFactors: false,
      transitionDynamicInsights: false,
      pdfLegislationPro: false,
      privacyWorkspace: false,
    })
  })

  it("pro: flags isPro ligadas; flags premium-only e freeWatermark desligadas", () => {
    expect(getPlgCapabilities("pro")).toEqual({
      rayxFull: true,
      boardReadyUnlocked: true,
      historyRichPreview: true,
      compareAB: true,
      legalOpinionTab: false,
      whiteLabelExport: false,
      collectiveIntel: false,
      complianceRadar: false,
      freeWatermark: false,
      transitionFullChart: true,
      transitionFocusYear: true,
      transitionAuditFactors: true,
      transitionDynamicInsights: true,
      pdfLegislationPro: true,
      privacyWorkspace: true,
    })
  })

  it("premium: todas ligadas, excepto freeWatermark", () => {
    expect(getPlgCapabilities("premium")).toEqual({
      rayxFull: true,
      boardReadyUnlocked: true,
      historyRichPreview: true,
      compareAB: true,
      legalOpinionTab: true,
      whiteLabelExport: true,
      collectiveIntel: true,
      complianceRadar: true,
      freeWatermark: false,
      transitionFullChart: true,
      transitionFocusYear: true,
      transitionAuditFactors: true,
      transitionDynamicInsights: true,
      pdfLegislationPro: true,
      privacyWorkspace: true,
    })
  })

  it("PUBLIC_REPORT_CAPABILITIES equivale a getPlgCapabilities(premium)", () => {
    expect(PUBLIC_REPORT_CAPABILITIES).toEqual(getPlgCapabilities("premium"))
  })
})
