import type { ClassificationItem } from "@/types/api"

/** Limiar exclusivo: acima disto = tier verde (enquadramento sólido). */
export const CONFIDENCE_TIER_GREEN_MIN = 0.85

/** Limiar inclusivo: abaixo do verde e desde este valor = âmbar. */
export const CONFIDENCE_TIER_YELLOW_MIN = 0.6

/** Banda de similaridade RAG «ténue» (acima do floor de retrieval, nexo fraco). */
export const RAG_NEXUS_TENUOUS_MIN = 0.35
export const RAG_NEXUS_TENUOUS_MAX = 0.55

export type ConfidenceTier = "green" | "yellow" | "red"

/**
 * Semáforo semântico sobre score 0–1 (confiança do classificador ou score agregado).
 * Única fonte de verdade para UI de Buffer de Confiança.
 */
export function confidenceTierFromScore01(score: number): ConfidenceTier {
  const s = Math.min(1, Math.max(0, score))
  if (s > CONFIDENCE_TIER_GREEN_MIN) return "green"
  if (s >= CONFIDENCE_TIER_YELLOW_MIN) return "yellow"
  return "red"
}

export function aggregatedScoreToPercent(score: number): number {
  return Math.round(Math.min(1, Math.max(0, score)) * 100)
}

/** Máxima similaridade RAG entre evidências da linha. */
export function maxEvidenceSimilarity(c: ClassificationItem | null | undefined): number | null {
  const ev = c?.evidence
  if (!ev?.length) return null
  let max = 0
  let any = false
  for (const e of ev) {
    const s = Number(e.similarity)
    if (Number.isFinite(s)) {
      any = true
      max = Math.max(max, s)
    }
  }
  return any ? max : null
}

/** Nexo legislativo ténue: artigo recuperado, mas ligação fraca à despesa. */
export function isTenuousRagNexus(maxSimilarity: number | null): boolean {
  if (maxSimilarity == null || !Number.isFinite(maxSimilarity)) return false
  return (
    maxSimilarity >= RAG_NEXUS_TENUOUS_MIN &&
    maxSimilarity <= RAG_NEXUS_TENUOUS_MAX
  )
}

export const TENUOUS_RAG_NEXUS_MESSAGE =
  "A IA encontrou um artigo, mas a conexão é tênue. Avalie o trecho com reserva; recomendamos validação humana antes de decisões perante terceiros."

/** Hint sob o gauge agregado (só âmbar/vermelho; verde = sem alarme). */
export function humanReviewHintFromAggregatedScore01(score: number): string | null {
  const tier = confidenceTierFromScore01(score)
  if (tier === "green") return null
  if (tier === "yellow") {
    return "Recomendamos revisão humana para este enquadramento."
  }
  return "Indicador agregado baixo: priorize itens com pouca aderência à lei recuperada e aplique a sua expertise antes de conclusões perante terceiros."
}

/**
 * Selo de honestidade técnica na Tab 3 (Veredito de Solidez): verde com mensagem positiva;
 * âmbar/vermelho com o mesmo texto que o gauge macro.
 */
export function humanSolidityHintFromAggregatedScore01(score: number): string {
  const tier = confidenceTierFromScore01(score)
  if (tier === "green") {
    return "Nexo legislativo e cobertura dentro do intervalo esperado; sem alertas de revisão."
  }
  return humanReviewHintFromAggregatedScore01(score) ?? "Indicador fora do intervalo ideal."
}

export function confidenceTierShortLabel(tier: ConfidenceTier): string {
  switch (tier) {
    case "green":
      return "Sólido"
    case "yellow":
      return "Revisar"
    case "red":
      return "Atípico"
    default:
      return "—"
  }
}

export function confidenceTierBadgeClassName(tier: ConfidenceTier): string {
  switch (tier) {
    case "green":
      return "border-emerald-500/50 bg-emerald-500/12 text-emerald-950 dark:text-emerald-100"
    case "yellow":
      return "border-amber-500/50 bg-amber-500/12 text-amber-950 dark:text-amber-100"
    case "red":
      return "border-red-500/45 bg-red-500/10 text-red-950 dark:text-red-200"
    default:
      return ""
  }
}

/**
 * Normaliza entrada heterogénea de `confidence_score` vinda da API para um
 * número clampado em [0, 1], ou `null` quando inválida.
 *
 * Aceita:
 *  - `number` finito  → clamp directo
 *  - `string` decimal → normaliza vírgula para ponto, faz trim, parseia, clamp
 *
 * Não redefine limiares nem tiers — isso é exclusivo de `confidenceTierFromScore01`.
 * Para scores monetários use `parseApiDecimal`; este helper é restrito a 0–1.
 */
export function parseConfidenceScore01(input: unknown): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null
    return Math.min(1, Math.max(0, input))
  }
  if (typeof input === "string") {
    const normalised = input.trim().replace(",", ".")
    if (normalised === "") return null
    const parsed = Number(normalised)
    if (!Number.isFinite(parsed)) return null
    return Math.min(1, Math.max(0, parsed))
  }
  return null
}
