/**
 * Utilitários de junção entre linhas de despesa e entradas de `credit_leaks`.
 *
 * CONTRATO ACTUAL (Abordagem A — 3.3.1):
 *   Join por `description.trim()` — espelho do padrão existente em expense-table.tsx.
 *
 * TODO(credit_leak_match): migrar para client_id quando CreditLeak expuser client_id
 *   (Abordagem B). Descrições duplicadas num mesmo batch podem colidir; com client_id
 *   o match é estável e adequado a auditoria de nível rigoroso.
 *   Passos: Go expõe client_id em CreditLeakResponse → DTO → histórico JSONB → OpenAPI
 *   → TS CreditLeak acrescenta `client_id?: string` → join primário por id, fallback
 *   description.
 */

import type { CreditLeak } from "@/types/api"

/**
 * Devolve a entrada de `credit_leaks` correspondente à linha de despesa, ou
 * `null` quando não há vazamento identificado para aquela descrição.
 *
 * "Go calcula; front apenas reflecte" — nenhuma aritmética aqui.
 */
export function findCreditLeakForRow(
  leaks: CreditLeak[] | undefined | null,
  description: string,
): CreditLeak | null {
  if (!leaks?.length) return null
  const target = description.trim()
  return leaks.find((l) => (l.description ?? "").trim() === target) ?? null
}

/**
 * Conveniência booleana — prefira `findCreditLeakForRow` quando o valor do leak
 * (lost_credit, reason) também for necessário.
 */
export function expenseInLeakList(
  leaks: CreditLeak[] | undefined | null,
  description: string,
): boolean {
  return findCreditLeakForRow(leaks, description) !== null
}
