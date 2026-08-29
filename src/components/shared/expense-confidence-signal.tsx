"use client"

import { ShieldCheck } from "lucide-react"
import {
  aggregatedScoreToPercent,
  confidenceTierFromScore01,
  confidenceTierShortLabel,
  parseConfidenceScore01,
  type ConfidenceTier,
} from "@/lib/confidence-tiers"
import { cn } from "@/lib/utils"

interface ExpenseConfidenceSignalProps {
  /** Score bruto da API (number ou string); normalizado internamente. */
  score: unknown
  /** Curadoria manual aplicada — soma um selo ao sinal, sem alterar o tier. */
  hasConsultantOverride?: boolean
  className?: string
}

function dotToneClass(tier: ConfidenceTier): string {
  switch (tier) {
    case "green":
      return "bg-emerald-500"
    case "yellow":
      return "bg-amber-500"
    case "red":
      // Slate-Red institucional (paridade com expense-semantic-confidence-dot.tsx).
      return "bg-[var(--tribia-verdict-increase-fg)]"
  }
}

/**
 * Sinal de confiança da classificação: dot colorido + rótulo textual sempre
 * visível ("Sólido · 92%"). Achado do critique: a coluna "Sinal" comunicava
 * só por cor (dot de 10px em tooltip) — aqui a cor nunca é o único canal, e o
 * rótulo sai também no board/print (é texto no DOM, não conteúdo de hover).
 * Tier deriva exclusivamente de confidenceTierFromScore01 — nunca hardcode
 * limiares aqui.
 */
export function ExpenseConfidenceSignal({
  score,
  hasConsultantOverride = false,
  className,
}: ExpenseConfidenceSignalProps) {
  const score01 = parseConfidenceScore01(score)

  if (score01 === null) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        {hasConsultantOverride ? (
          <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        ) : null}
        —
      </span>
    )
  }

  const tier = confidenceTierFromScore01(score01)
  const pct = aggregatedScoreToPercent(score01)
  const label = confidenceTierShortLabel(tier)

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`${label} — ${pct} por cento de confiança jurídica${
        hasConsultantOverride ? " · decisão do consultor aplicada ao cálculo" : ""
      }`}
    >
      <span className={cn("block h-2.5 w-2.5 shrink-0 rounded-full", dotToneClass(tier))} aria-hidden />
      <span className="text-xs font-medium whitespace-nowrap text-foreground">
        {label} · {pct}%
      </span>
      {hasConsultantOverride ? (
        <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      ) : null}
    </span>
  )
}
