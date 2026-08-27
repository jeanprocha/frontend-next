import type { FormExpense, FormService } from "@/types/api"

export function makeLineId(): string {
  return Math.random().toString(36).slice(2)
}

export function createBlankServiceLine(): FormService {
  return { id: makeLineId(), description: "", amount: "", iss_rate: "0.05" }
}

export function createBlankExpenseLine(): FormExpense {
  return { id: makeLineId(), description: "", amount: "" }
}

/**
 * Predicado único de "linha preenchida" (FE-3, PR 3c) — antes existiam 3
 * cópias sutilmente diferentes (submit do form sem `.trim()`, atalho ⌘Enter
 * com `.trim()`, use-pipeline-stage com `.trim()`). Esta é a versão `.trim()`;
 * uma linha só com espaços não conta mais como preenchida em lugar nenhum.
 */
export function isFilledLine(row: { description?: string; amount?: string }): boolean {
  return Boolean(row.description?.trim() && row.amount?.trim())
}
