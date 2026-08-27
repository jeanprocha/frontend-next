import { describe, expect, it } from "vitest"
import { insightYearMismatch } from "./tribia-insight-focus"

describe("insightYearMismatch", () => {
  it("detecta quando o ano do resultado difere do ano da execução", () => {
    expect(insightYearMismatch(2028, 2026)).toBe(true)
    expect(insightYearMismatch(2026, 2026)).toBe(false)
    expect(insightYearMismatch(2028, undefined)).toBe(false)
  })
})
