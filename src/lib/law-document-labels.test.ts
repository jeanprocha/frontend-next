import { describe, expect, it } from "vitest"
import { labelForChunkId } from "./law-document-labels"

describe("labelForChunkId", () => {
  it("reconhece o prefixo lc68_", () => {
    expect(labelForChunkId("lc68_0052_art_52")).toBe("LC 68/2024")
  })

  it("reconhece o prefixo lc214_", () => {
    expect(labelForChunkId("lc214_0001_art_1")).toBe("LC 214/2025")
  })

  it("prefixo desconhecido devolve vazio", () => {
    expect(labelForChunkId("lc227_0001_art_1")).toBe("")
  })

  it("string vazia devolve vazio", () => {
    expect(labelForChunkId("")).toBe("")
    expect(labelForChunkId("   ")).toBe("")
  })

  it("ignora espaços nas pontas", () => {
    expect(labelForChunkId("  lc68_0052_art_52  ")).toBe("LC 68/2024")
  })
})
