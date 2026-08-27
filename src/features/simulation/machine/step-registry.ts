// Registry canónico do pipeline (FE-3, PR 3b) — a máquina (transition.ts,
// machine-store.ts) não conhece "classify"/"simulate" por nome, só percorre
// esta lista na ordem declarada. Um passo novo (ex.: validating-rfb, W7) é
// UMA linha aqui, mais a sua implementação em steps.ts — nada no reducer, no
// executor ou na página muda.
import { classifyStep, simulateStep } from "./steps"
import type { Step, StepId } from "./machine-types"

export const PIPELINE_STEPS: readonly Step[] = [classifyStep, simulateStep]

export function stepById(steps: readonly Step[], id: StepId): Step | undefined {
  return steps.find((s) => s.id === id)
}
