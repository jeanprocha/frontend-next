// Importer CSV (FE-3, PR 3c) — port de upload-zone.tsx, mas só o parse: a
// classificação e a simulação deixam de acontecer aqui. `parse` é puro e
// síncrono (Papa.parse em modo string não usa FileReader nem worker),
// testável sem DOM.
import Papa from "papaparse"
import { makeLineId } from "@/lib/simulation-line-helpers"
import type { ImporterDefinition, ImporterParseResult } from "@/lib/importer-contract"
import type { FormExpense, FormService } from "@/types/api"

// Colunas aceitas no CSV (case-insensitive, variações PT e EN) — verbatim do upload-zone original.
const COL_DESC = ["descricao", "descrição", "description", "desc", "nome", "name", "item"]
const COL_AMT = ["valor", "value", "amount", "preco", "preço", "price", "custo", "cost"]
// Etapa N/PR 5 — coluna opcional; ausente = retrocompatível (tudo despesa, comportamento antigo).
const COL_TYPE = ["tipo", "type"]
const REVENUE_VALUES = ["receita", "receitas", "revenue", "revenues", "income"]
// Sem coluna própria de alíquota no CSV — mesmo default de createBlankServiceLine().
const DEFAULT_SERVICE_ISS_RATE = "0.05"

function findCol(headers: string[], candidates: string[]): string | undefined {
  return headers.find((h) => candidates.includes(h.trim().toLowerCase()))
}

function parseCsvContent(content: string): ImporterParseResult {
  const res = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true })
  const headers = res.meta.fields ?? []
  const descCol = findCol(headers, COL_DESC)
  const amtCol = findCol(headers, COL_AMT)
  const typeCol = findCol(headers, COL_TYPE)

  if (!descCol) {
    return {
      ok: false,
      error: `Coluna de descrição não encontrada. Esperado: ${COL_DESC.join(", ")}. Colunas detectadas: ${headers.join(", ")}`,
    }
  }

  const services: FormService[] = []
  const expenses: FormExpense[] = []

  for (const row of res.data) {
    const description = (row[descCol] ?? "").trim()
    if (!description) continue
    const amount = amtCol ? (row[amtCol] ?? "0").trim() : "0"
    // Linha sem coluna tipo, ou com valor não reconhecido, vira despesa —
    // mesmo comportamento de antes da coluna existir (bug-for-bug preservado).
    const isRevenue = typeCol ? REVENUE_VALUES.includes((row[typeCol] ?? "").trim().toLowerCase()) : false
    if (isRevenue) {
      services.push({ id: makeLineId(), description, amount, iss_rate: DEFAULT_SERVICE_ISS_RATE })
    } else {
      expenses.push({ id: makeLineId(), description, amount })
    }
  }

  if (services.length === 0 && expenses.length === 0) {
    return { ok: false, error: "Nenhuma linha válida encontrada no arquivo." }
  }

  return {
    ok: true,
    draft: {
      ...(services.length > 0 && { services }),
      ...(expenses.length > 0 && { expenses }),
    },
  }
}

export const csvImporter: ImporterDefinition = {
  id: "csv",
  label: "Upload de CSV",
  accepts: [".csv", ".txt"],
  formatHint: "descricao,valor",
  parse: parseCsvContent,
}
