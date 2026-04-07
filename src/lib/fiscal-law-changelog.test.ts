import { describe, expect, it } from "vitest"
import {
  FISCAL_LAW_CHANGELOG,
  fiscalLawVersionLabel,
} from "./fiscal-law-changelog"

describe("fiscal-law-changelog — audit trail UI/PDF", () => {
  it("expõe versão canónica única para navbar, changelog e rodapé de impressão", () => {
    const v = FISCAL_LAW_CHANGELOG.version
    expect(v).toBeTruthy()
    expect(typeof v).toBe("string")
    expect(v.trim()).toBe(v)
  })

  it("fiscalLawVersionLabel usa a mesma versão por defeito que o payload", () => {
    expect(fiscalLawVersionLabel()).toBe(
      `LC 68/2024 v${FISCAL_LAW_CHANGELOG.version}`,
    )
    expect(fiscalLawVersionLabel(FISCAL_LAW_CHANGELOG.version)).toBe(
      fiscalLawVersionLabel(),
    )
  })

  it("rótulo explícito com versão coincide com a string esperada no PrintReportFooter (default lawVersion)", () => {
    const footerDefault = fiscalLawVersionLabel(FISCAL_LAW_CHANGELOG.version)
    const navbarStyle = fiscalLawVersionLabel()
    expect(footerDefault).toBe(navbarStyle)
  })
})
