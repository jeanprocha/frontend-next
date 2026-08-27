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

  it("fiscalLawVersionLabel usa a mesma versão e rótulo por defeito que o payload", () => {
    expect(fiscalLawVersionLabel()).toBe(
      `${FISCAL_LAW_CHANGELOG.label} v${FISCAL_LAW_CHANGELOG.version}`,
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

  it("fiscalLawVersionLabel aceita um rótulo de documento diferente (corpus real, W1)", () => {
    expect(fiscalLawVersionLabel("1", "LC 214/2025")).toBe("LC 214/2025 v1")
  })
})
