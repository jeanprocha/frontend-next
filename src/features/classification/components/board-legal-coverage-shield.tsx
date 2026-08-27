"use client"

import { Badge } from "@/components/ui/badge"
import {
  aggregatedScoreToPercent,
  confidenceTierBadgeClassName,
  confidenceTierShortLabel,
} from "@/lib/confidence-tiers"
import type { ConfidenceTier } from "@/lib/confidence-tiers"
import { cn } from "@/lib/utils"

export interface BoardLegalCoverageShieldProps {
  coveragePct: number | null
  withEvidence: number
  total: number
  tier: ConfidenceTier | null
  score: number | null | undefined
  solidityHint: string | null
  className?: string
}

/**
 * Secção 1 da Tab 3 — metáfora de protecção institucional (SVG linear),
 * sem competir com o «momento premium» da sidebar (bordas + sombra suave).
 */
export function BoardLegalCoverageShield({
  coveragePct,
  withEvidence,
  total,
  tier,
  score,
  solidityHint,
  className,
}: BoardLegalCoverageShieldProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card/80 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:bg-card/40",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Cobertura legal e integridade
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex shrink-0 justify-center sm:justify-start">
          <svg
            viewBox="0 0 56 64"
            className="h-16 w-14 text-emerald-600/35 dark:text-emerald-400/40"
            aria-hidden
          >
            <path
              d="M28 4L8 14v22c0 14 8.5 24 20 28 11.5-4 20-14 20-28V14L28 4z"
              fill="currentColor"
              fillOpacity={0.12}
              stroke="currentColor"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {coveragePct != null ? (
            <p className="text-foreground">
              <span className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
                {coveragePct}%
              </span>
              <span className="ml-2 text-sm font-sans font-medium leading-snug text-muted-foreground">
                cobertura legal
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Cobertura legal (índice) indisponível nesta execução.</p>
          )}
          <p className="text-[11px] leading-snug text-muted-foreground">
            Sessão auditada · Integridade legislativa verificada
          </p>
          <p className="text-xs leading-snug text-foreground">
            Fundamentos encontrados para{" "}
            <span className="font-mono font-semibold tabular-nums">{withEvidence}</span> das{" "}
            <span className="font-mono font-semibold tabular-nums">{total}</span> despesas processadas neste simulador.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {tier && score != null && Number.isFinite(score) ? (
              <Badge
                variant="outline"
                className={cn("text-[10px] font-semibold", confidenceTierBadgeClassName(tier))}
              >
                {confidenceTierShortLabel(tier)} · {aggregatedScoreToPercent(score)}%
              </Badge>
            ) : null}
          </div>
          {solidityHint ? (
            <p
              className={cn(
                "rounded-md border px-2 py-1.5 text-[11px] leading-snug",
                tier === "green"
                  ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-950 dark:text-emerald-100"
                  : tier === "yellow"
                    ? "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                    : tier === "red"
                      ? "border-red-500/35 bg-red-500/10 text-red-950 dark:text-red-100"
                      : "border-border/60 bg-muted/30 text-foreground",
              )}
            >
              {solidityHint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
