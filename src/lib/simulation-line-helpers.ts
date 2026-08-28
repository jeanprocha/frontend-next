import type { FormExpense, FormService } from "@/types/api"
import { parseApiDecimal } from "./money-decimal"

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

/**
 * Etapa N/PR 7 (fato 15) — total em tela (subtotal de receita/despesa). Antes
 * era `parseFloat(x.amount) || 0` direto no componente: viola a convenção do
 * domínio fiscal (CLAUDE.md — conversão de valor monetário só dentro de lib/
 * com decimal.js) e mascarava lixo como zero. `parseApiDecimal` já sabe ler
 * vírgula decimal (formato do placeholder "0,00" dos campos).
 */
export function parseLineAmount(raw: string | undefined): number {
  const d = parseApiDecimal(raw)
  return d ? d.toNumber() : 0
}

/** true só se o texto for reconhecível como número — não usa `|| 0` (isso é o bug: "abc" virava 0 silenciosamente). */
export function isValidAmount(raw: string | undefined): boolean {
  return parseApiDecimal(raw) !== null
}

/** Serviço preenchido E com valor/alíquota numéricos — os dois campos viram string decimal para o motor Go. */
export function isValidService(s: FormService): boolean {
  return isFilledLine(s) && isValidAmount(s.amount) && isValidAmount(s.iss_rate)
}

/** Despesa preenchida E com valor numérico. */
export function isValidExpense(e: FormExpense): boolean {
  return isFilledLine(e) && isValidAmount(e.amount)
}

export const SIMULATION_YEAR_MIN = 2026
export const SIMULATION_YEAR_MAX = 2033

/** Corrige (não rejeita) um ano fora de 2026–2033 — o backend só aceita esse intervalo. */
export function clampSimulationYear(year: number): number {
  if (!Number.isFinite(year)) return SIMULATION_YEAR_MIN
  return Math.min(SIMULATION_YEAR_MAX, Math.max(SIMULATION_YEAR_MIN, Math.round(year)))
}

export type SimulationLineValidation =
  | { ok: true; validServices: FormService[]; validExpenses: FormExpense[] }
  | {
      ok: false
      /** mensagem pronta pra exibir perto do campo, nomeando a linha problemática quando dá. */
      message: string
      /** ids das linhas (serviço e/ou despesa) com valor inválido, para realçar a linha certa. */
      invalidLineIds: string[]
    }

/**
 * Etapa N/PR 7 (fato 9) — validação única para os dois caminhos que disparam
 * uma simulação (clique em "Simular impacto tributário" e o atalho ⌘Enter em
 * simulation-dashboard.tsx): antes, os dois faziam
 * `if (validServices.length === 0) return` sem avisar nada — o atalho de
 * teclado em especial não tinha nenhum jeito de o usuário descobrir por que
 * nada aconteceu. Também é aqui que valor não-numérico é barrado antes de
 * virar `0`/`NaN` silencioso e seguir para o motor Go.
 */
export function validateSimulationLines(
  services: FormService[],
  expenses: FormExpense[],
): SimulationLineValidation {
  const filledServices = services.filter(isFilledLine)
  const filledExpenses = expenses.filter(isFilledLine)

  if (filledServices.length === 0) {
    return {
      ok: false,
      message: "Adicione ao menos um serviço com valor para simular.",
      invalidLineIds: [],
    }
  }

  const invalidServices = filledServices.filter((s) => !isValidService(s))
  if (invalidServices.length > 0) {
    const first = invalidServices[0]
    return {
      ok: false,
      message: `Revise o valor ou a alíquota de "${first.description}" — use apenas números (ex.: 1200,00).`,
      invalidLineIds: invalidServices.map((s) => s.id),
    }
  }

  const invalidExpenses = filledExpenses.filter((e) => !isValidExpense(e))
  if (invalidExpenses.length > 0) {
    const first = invalidExpenses[0]
    return {
      ok: false,
      message: `Revise o valor de "${first.description}" — use apenas números (ex.: 500,00).`,
      invalidLineIds: invalidExpenses.map((e) => e.id),
    }
  }

  return {
    ok: true,
    validServices: filledServices,
    validExpenses: filledExpenses,
  }
}
