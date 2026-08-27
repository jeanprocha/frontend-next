// Importer CSV (FE-3, PR 3c) — port de upload-zone.tsx, mas só o parse: a
// classificação e a simulação deixam de acontecer aqui. `parse` é puro e
// síncrono (Papa.parse em modo string não usa FileReader nem worker),
// testável sem DOM.
import Papa from "papaparse"
import { makeLineId } from "@/lib/simulation-line-helpers"
import type { ImporterDefinition, ImporterParseResult } from "@/lib/importer-contract"

// Colunas aceitas no CSV (case-insensitive, variações PT e EN) — verbatim do upload-zone original.
const COL_DESC = ["descricao", "descrição", "description", "desc", "nome", "name", "item"]
const COL_AMT = ["valor", "value", "amount", "preco", "preço", "price", "custo", "cost"]

function findCol(headers: string[], candidates: string[]): string | undefined {
  return headers.find((h) => candidates.includes(h.trim().toLowerCase()))
}

function parseCsvContent(content: string): ImporterParseResult {
  const res = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true })
  const headers = res.meta.fields ?? []
  const descCol = findCol(headers, COL_DESC)
  const amtCol = findCol(headers, COL_AMT)

  if (!descCol) {
    return {
      ok: false,
      error: `Coluna de descrição não encontrada. Esperado: ${COL_DESC.join(", ")}. Colunas detectadas: ${headers.join(", ")}`,
    }
  }

  const expenses = res.data
    .map((row) => ({
      id: makeLineId(),
      description: (row[descCol] ?? "").trim(),
      amount: amtCol ? (row[amtCol] ?? "0").trim() : "0",
    }))
    .filter((r) => r.description)

  if (expenses.length === 0) {
    return { ok: false, error: "Nenhuma linha válida encontrada no arquivo." }
  }

  return { ok: true, draft: { expenses } }
}

export const csvImporter: ImporterDefinition = {
  id: "csv",
  label: "Upload de CSV",
  accepts: [".csv", ".txt"],
  formatHint: "descricao,valor",
  parse: parseCsvContent,
}
