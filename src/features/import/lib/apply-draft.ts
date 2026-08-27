import { useTaxStore } from "@/store/useTaxStore"
import type { SimulationDraft } from "@/lib/importer-contract"

/**
 * Aplica um rascunho de importer ao estado de entrada (FE-3, PR 3c) — só os
 * campos presentes substituem o valor correspondente no store; campos
 * ausentes ficam intactos. O usuário completa o resto no formulário.
 */
export function applyDraftToStore(draft: SimulationDraft): void {
  const store = useTaxStore.getState()
  if (draft.services) store.setServices(draft.services)
  if (draft.expenses) store.setExpenses(draft.expenses)
  if (draft.companyContext !== undefined) store.setCompanyContext(draft.companyContext)
  if (draft.year !== undefined) store.setYear(draft.year)
}
