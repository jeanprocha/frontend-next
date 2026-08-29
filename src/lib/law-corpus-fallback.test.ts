import { describe, expect, it } from "vitest"
import { FISCAL_LAW_CHANGELOG, LAW_SOURCE_URL } from "@/lib/fiscal-law-changelog"
import { corpusToChangelogPayload, staticCorpusFallback } from "./law-corpus-fallback"

describe("staticCorpusFallback", () => {
  it("devolve um único documento espelhando a constante FISCAL_LAW_CHANGELOG", () => {
    const corpus = staticCorpusFallback()
    expect(corpus.documents).toHaveLength(1)
    expect(corpus.current_document_id).toBe(corpus.documents[0].id)
    expect(corpus.documents[0]).toMatchObject({
      label: FISCAL_LAW_CHANGELOG.label,
      version: FISCAL_LAW_CHANGELOG.version,
      published_at: FISCAL_LAW_CHANGELOG.date,
      source_url: LAW_SOURCE_URL,
    })
    expect(corpus.changelog).toBe(FISCAL_LAW_CHANGELOG.updates)
  })

  // Regressão: o id/prefixo ficaram em `lc68_` depois da virada da Onda 2/PR 6
  // enquanto o label já dizia "LC 214/2025". Com a API fora do ar, um dossiê que
  // citou `lc68_` casava esse prefixo e era rotulado com a lei errada.
  it("identidade do documento casa com o rótulo exibido", () => {
    const doc = staticCorpusFallback().documents[0]
    expect(doc.label).toBe("LC 214/2025")
    expect(doc.id).toBe("lc214-2025")
    expect(doc.chunk_prefix).toBe("lc214_")
  })

  // O changelog do fallback é vazio por decisão: o real é fato de indexação
  // servido pelo backend, e o fallback não tem como sabê-lo sem inventar.
  it("não inventa histórico de mudanças quando o servidor não responde", () => {
    expect(staticCorpusFallback().changelog).toEqual([])
  })
})

describe("corpusToChangelogPayload", () => {
  it("converte o fallback de volta num payload idêntico à constante atual (ida e volta sem perda)", () => {
    const payload = corpusToChangelogPayload(staticCorpusFallback())
    expect(payload).toEqual({
      version: FISCAL_LAW_CHANGELOG.version,
      date: FISCAL_LAW_CHANGELOG.date,
      label: FISCAL_LAW_CHANGELOG.label,
      sourceUrl: FISCAL_LAW_CHANGELOG.sourceUrl,
      updates: FISCAL_LAW_CHANGELOG.updates,
    })
  })

  it("usa o documento current_document_id, não o primeiro da lista, quando há mais de um", () => {
    const payload = corpusToChangelogPayload({
      documents: [
        { id: "a", label: "A", version: "1.0", published_at: "2020-01-01", source_url: "https://a" },
        { id: "b", label: "B", version: "2.0", published_at: "2024-06-01", source_url: "https://b" },
      ],
      current_document_id: "b",
      changelog: [],
    })
    expect(payload.version).toBe("2.0")
    expect(payload.date).toBe("2024-06-01")
    expect(payload.label).toBe("B")
    expect(payload.sourceUrl).toBe("https://b")
  })
})
