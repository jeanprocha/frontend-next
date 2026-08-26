// Port verbatim de useTaxStore.applyExpenseClassificationOverride /
// removeExpenseClassificationOverride / clearAllExpenseClassificationOverrides
// (mesmo matching client_id → fallback description; mesma imutabilidade).
import type { ClassificationItem, ConsultantClassificationOverride } from "@/types/api"
import type { FormResults, OverrideEvent } from "./machine-types"

function matchesClientId(c: ClassificationItem, clientId: string): boolean {
  return (c.client_id != null && c.client_id === clientId) || (!c.client_id && c.description === clientId)
}

export function applyOverride(
  results: FormResults,
  clientId: string,
  override: ConsultantClassificationOverride,
): FormResults {
  const updated = results.classifications.map((c) =>
    matchesClientId(c, clientId) ? { ...c, consultant_override: override } : c,
  )
  return { ...results, classifications: updated }
}

export function removeOverride(results: FormResults, clientId: string): FormResults {
  const updated = results.classifications.map((c) => {
    if (!matchesClientId(c, clientId)) return c
    const { consultant_override: _removed, ...rest } = c
    return rest as ClassificationItem
  })
  return { ...results, classifications: updated }
}

/** Sem override existente → retorna a MESMA referência (no-op, como no store original). */
export function clearAllOverrides(results: FormResults): FormResults {
  const hasAny = results.classifications.some((c) => c.consultant_override)
  if (!hasAny) return results
  const updated = results.classifications.map((c) => {
    if (!c.consultant_override) return c
    const { consultant_override: _removed, ...rest } = c
    return rest as ClassificationItem
  })
  return { ...results, classifications: updated }
}

export function applyOverrideEvent(results: FormResults, event: OverrideEvent): FormResults {
  switch (event.type) {
    case "OVERRIDE_APPLIED":
      return applyOverride(results, event.clientId, event.override)
    case "OVERRIDE_REMOVED":
      return removeOverride(results, event.clientId)
    case "OVERRIDES_CLEARED":
      return clearAllOverrides(results)
  }
}
