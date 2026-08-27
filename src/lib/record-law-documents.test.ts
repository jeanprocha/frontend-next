import { describe, expect, it } from "vitest"
import type { ClassificationItem } from "@/types/api"
import type { LawCorpusDocument } from "@/lib/api/legal"
import { lawDocumentsCitedByRecord } from "./record-law-documents"

const LC68: LawCorpusDocument = {
  id: "lc68-2024",
  label: "LC 68/2024",
  version: "3.0",
  published_at: "2024-07-22",
  source_url: "https://example.com/lc68",
  chunk_prefix: "lc68_",
}

const LC214: LawCorpusDocument = {
  id: "lc214-2025",
  label: "LC 214/2025",
  version: "4.0",
  published_at: "2025-01-16",
  source_url: "https://example.com/lc214",
  chunk_prefix: "lc214_",
}

const DOCS = [LC68, LC214]

function classification(articleIds: string[]): ClassificationItem {
  return {
    description: "Licença de software",
    is_eligible: true,
    confidence: 0.9,
    justification: "…",
    legal_base: "Art. 47",
    risk_level: "baixo",
    regime_type: "padrao",
    evidence: articleIds.map((article_id) => ({ article_id, content: "…", similarity: 0.8 })),
  }
}

describe("lawDocumentsCitedByRecord", () => {
  it("casa o documento pelo prefixo do article_id da evidência", () => {
    const record = { classifications: [classification(["lc68_0052_art_52"])] }
    expect(lawDocumentsCitedByRecord(record, DOCS)).toEqual([LC68])
  })

  it("um dossiê que citou a LC 68 continua apontando LC 68 mesmo com a LC 214 no catálogo", () => {
    // O caso que motiva a PR: a LC 214 já é o documento corrente, mas este
    // registro foi gerado antes — o selo dele não pode migrar sozinho.
    const record = { classifications: [classification(["lc68_0001_art_1"])] }
    const cited = lawDocumentsCitedByRecord(record, DOCS)
    expect(cited).toHaveLength(1)
    expect(cited[0].label).toBe("LC 68/2024")
    expect(cited[0].published_at).toBe("2024-07-22")
  })

  it("considera também as classificações de serviço", () => {
    const record = { classifications: [], serviceClassifications: [classification(["lc214_0010_art_10"])] }
    expect(lawDocumentsCitedByRecord(record, DOCS)).toEqual([LC214])
  })

  it("registro sem evidência devolve lista vazia (nada a afirmar)", () => {
    expect(lawDocumentsCitedByRecord({ classifications: [classification([])] }, DOCS)).toEqual([])
    expect(lawDocumentsCitedByRecord({}, DOCS)).toEqual([])
  })

  it("evidência ausente no snapshot antigo não quebra", () => {
    const semEvidence = { description: "x", is_eligible: true, confidence: 0.5, justification: "", legal_base: "", risk_level: "baixo", regime_type: "padrao" } as unknown as ClassificationItem
    expect(lawDocumentsCitedByRecord({ classifications: [semEvidence] }, DOCS)).toEqual([])
  })

  it("prefixo desconhecido no catálogo não casa nada", () => {
    const record = { classifications: [classification(["lc227_0001_art_1"])] }
    expect(lawDocumentsCitedByRecord(record, DOCS)).toEqual([])
  })

  it("documento sem chunk_prefix nunca casa — sem prefixo não há prova", () => {
    const semPrefixo: LawCorpusDocument = { ...LC68, chunk_prefix: undefined }
    const record = { classifications: [classification(["lc68_0052_art_52"])] }
    expect(lawDocumentsCitedByRecord(record, [semPrefixo])).toEqual([])
  })

  it("registro que cita dois documentos devolve ambos, na ordem do catálogo", () => {
    const record = {
      classifications: [classification(["lc214_0010_art_10"])],
      serviceClassifications: [classification(["lc68_0052_art_52"])],
    }
    expect(lawDocumentsCitedByRecord(record, DOCS)).toEqual([LC68, LC214])
  })
})
