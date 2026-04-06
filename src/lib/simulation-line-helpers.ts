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
