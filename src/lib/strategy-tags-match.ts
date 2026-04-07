import { STRATEGY_KEYWORDS } from "@/constants/strategy-mapping"
import type { StrategyTag } from "@/types/api"

/** Normaliza para matching estável (minúsculas, sem acentos, espaços colapsados). Paridade com Go strategytags.NormalizePattern. */
export function normalizeText(s: string): string {
  const t = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
  return t.replace(/\s+/g, " ").trim()
}

const schemeToColor: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50",
  emerald:
    "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
  amber:
    "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50",
  purple:
    "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50",
}

export function colorSchemeToChipClasses(scheme: string): string {
  const k = scheme.trim().toLowerCase()
  return schemeToColor[k] ?? schemeToColor.emerald
}

/** Fallback local se GET /strategy-tags falhar (paridade com seed SQL). */
export function getFallbackStrategyTags(): StrategyTag[] {
  const out: StrategyTag[] = []
  const schemeByKey: Record<string, string> = {
    saas: "blue",
    export: "emerald",
    real_estate: "amber",
    liberal: "purple",
  }
  for (const row of STRATEGY_KEYWORDS) {
    const cs = schemeByKey[row.key] ?? "emerald"
    for (const p of row.patterns) {
      out.push({
        pattern: p,
        label: row.label,
        category: "Perfil",
        color_scheme: cs,
      })
    }
  }
  return out
}

/** Remove duplicados por pattern normalizado (primeira ocorrência vence). */
export function dedupeStrategyTagsByPattern(tags: StrategyTag[]): StrategyTag[] {
  const seen = new Set<string>()
  const out: StrategyTag[] = []
  for (const t of tags) {
    const k = normalizeText(t.pattern)
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

export interface ActiveStrategyRow {
  tag: StrategyTag
  isNew: boolean
}

/** Tags cujo pattern aparece no texto (uma linha por label); isNew = descoberta de sessão. */
export function matchActiveStrategyTags(
  text: string,
  tags: StrategyTag[],
  highlightPatterns: readonly string[],
): ActiveStrategyRow[] {
  const normInput = normalizeText(text)
  const highlightSet = new Set(highlightPatterns.map((p) => normalizeText(p)))
  const seenLabels = new Set<string>()
  const rows: ActiveStrategyRow[] = []
  for (const t of tags) {
    const pn = normalizeText(t.pattern)
    if (!pn || !normInput.includes(pn)) continue
    if (seenLabels.has(t.label)) continue
    seenLabels.add(t.label)
    rows.push({ tag: t, isNew: highlightSet.has(pn) })
  }
  return rows
}
