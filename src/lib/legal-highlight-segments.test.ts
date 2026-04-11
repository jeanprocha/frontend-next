import { describe, expect, it } from "vitest"
import { buildLegalHighlightSegments } from "./legal-highlight-segments"

describe("buildLegalHighlightSegments", () => {
  it("realça strong e texto entre", () => {
    const segs = buildLegalHighlightSegments("Antes crédito depois", ["crédito"], [])
    expect(segs.some((s) => s.type === "strong" && s.value === "crédito")).toBe(true)
  })

  it("strong prevalece sobre tentative sobreposto", () => {
    const segs = buildLegalHighlightSegments("foo bar baz", ["foo bar"], ["bar"])
    const strong = segs.filter((s) => s.type === "strong")
    expect(strong.length).toBe(1)
    expect(strong[0].value).toContain("foo")
  })
})
