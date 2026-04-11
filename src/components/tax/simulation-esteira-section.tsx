"use client"

/**
 * Wrapper de compatibilidade — delega para SimulationResultsTopDown.
 * Mantém a assinatura pública para que page.tsx não necessite de alterações.
 */
import {
  SimulationResultsTopDown,
  type SimulationResultsTopDownProps,
} from "@/components/tax/simulation-results-top-down"

export type SimulationEsteiraSectionProps = SimulationResultsTopDownProps

export function SimulationEsteiraSection(props: SimulationEsteiraSectionProps) {
  return <SimulationResultsTopDown {...props} />
}
