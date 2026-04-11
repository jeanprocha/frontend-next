/**
 * classification-effective.ts
 *
 * Helper único "IA vs efectivo" para o módulo de override (3.4.1).
 *
 * Invariante central:
 *   ClassificationItem.is_eligible / .regime_type  → sugestão da IA (imutável)
 *   consultant_override.is_eligible / .regime_type → decisão do consultor
 *
 * Todos os consumidores que precisem dos valores ENVIADOS AO MOTOR GO devem
 * usar getEffectiveExpenseSimulationFields(). NUNCA ler .is_eligible directamente
 * para montar SimulationRequest.
 */

import type { ClassificationItem } from "@/types/api"

// ─── Tipos de suporte ────────────────────────────────────────────────────────

export interface EffectiveSimulationFields {
  is_eligible: boolean
  regime_type: string
}

/**
 * Cada entrada do Command (Smart List).
 * valueKey é uma chave string opaca que identifica univocamente o par
 * (is_eligible, regime_type) no contrato do motor Go.
 */
export interface OverrideOption {
  valueKey: string
  label: string
  is_eligible: boolean
  regime_type: string
}

// ─── Lista fechada de opções válidas ─────────────────────────────────────────
//
// Alinhada ao normalizador Go: ExpenseInput aceita is_eligible + regime_type
// com valores "padrao" | "diferenciado_60" | "reduzido_zero".
// Lista pré-ordenada alfabeticamente por label (pt-BR) — estável sem sort em runtime.
//
// Inelegível: regime_type "padrao" é o default do normalizador Go quando a
// despesa não gera crédito; não faz sentido expor "inelegível + diferenciado"
// ao consultor pois a distinção de alíquota só importa na saída elegível.

export const EXPENSE_OVERRIDE_OPTIONS: readonly OverrideOption[] = [
  {
    valueKey: "eligible_reduzido_zero",
    label: "Elegível · Alíquota Zero",
    is_eligible: true,
    regime_type: "reduzido_zero",
  },
  {
    valueKey: "eligible_diferenciado_60",
    label: "Elegível · Diferenciado 60%",
    is_eligible: true,
    regime_type: "diferenciado_60",
  },
  {
    valueKey: "eligible_padrao",
    label: "Elegível · Padrão",
    is_eligible: true,
    regime_type: "padrao",
  },
  {
    valueKey: "ineligible",
    label: "Não elegível a crédito",
    is_eligible: false,
    regime_type: "padrao",
  },
] as const

// ─── Helpers de lookup ───────────────────────────────────────────────────────

/**
 * Devolve a OverrideOption que mais se aproxima do par fornecido.
 * Fallback: "Elegível · Padrão" se não encontrar correspondência exacta.
 */
export function findOverrideOption(is_eligible: boolean, regime_type: string): OverrideOption {
  const match = EXPENSE_OVERRIDE_OPTIONS.find(
    (o) => o.is_eligible === is_eligible && o.regime_type === regime_type,
  )
  return match ?? EXPENSE_OVERRIDE_OPTIONS.find((o) => o.valueKey === "eligible_padrao")!
}

export function findOverrideOptionByKey(valueKey: string): OverrideOption | undefined {
  return EXPENSE_OVERRIDE_OPTIONS.find((o) => o.valueKey === valueKey)
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Devolve os campos efectivos a usar no SimulationRequest para o motor Go.
 * Se existir consultant_override, prevalece; caso contrário usa sugestão da IA.
 * Suporta null/undefined para rows sem classificação (fallback seguro).
 */
export function getEffectiveExpenseSimulationFields(
  c: ClassificationItem | null | undefined,
): EffectiveSimulationFields {
  if (!c) return { is_eligible: false, regime_type: "padrao" }
  if (c.consultant_override) {
    return {
      is_eligible: c.consultant_override.is_eligible,
      regime_type: c.consultant_override.regime_type || "padrao",
    }
  }
  return {
    is_eligible: c.is_eligible,
    regime_type: c.regime_type || "padrao",
  }
}

/** Verdadeiro quando a linha tem uma substituição manual activa. */
export function hasConsultantOverride(c: ClassificationItem | null | undefined): boolean {
  return Boolean(c?.consultant_override)
}

/**
 * Rótulo curto da sugestão da IA para badges e tooltips de auditoria.
 * Ex.: "Elegível · Padrão", "Não elegível a crédito".
 */
export function getAiSuggestedLabel(c: ClassificationItem): string {
  return findOverrideOption(c.is_eligible, c.regime_type).label
}

/**
 * Rótulo curto do valor efectivo (override ou IA) para o badge da linha.
 */
export function getEffectiveLabel(c: ClassificationItem | null | undefined): string {
  if (!c) return "Sem classificação"
  const eff = getEffectiveExpenseSimulationFields(c)
  return findOverrideOption(eff.is_eligible, eff.regime_type).label
}

/**
 * Devolve a OverrideOption que corresponde ao valor efectivo actual.
 * Útil para marcar a opção seleccionada no Command.
 */
export function getEffectiveOption(c: ClassificationItem | null | undefined): OverrideOption {
  const eff = getEffectiveExpenseSimulationFields(c)
  return findOverrideOption(eff.is_eligible, eff.regime_type)
}
