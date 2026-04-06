"use client"

import { ArrowRightLeft, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/api"

interface ComparisonVerdictCardProps {
  /** Diferença acumulada (B − A) na série new_tax_net; null se indisponível */
  accumulatedDiff: number | null
  /** Diferença projected.net_tax B − A */
  projectedNetDiff: number
  strategyInsight?: string
}

export function ComparisonVerdictCard({
  accumulatedDiff,
  projectedNetDiff,
  strategyInsight,
}: ComparisonVerdictCardProps) {
  // projectedNetDiff negativo = B paga menos (economia vs A)
  const savingVsA = projectedNetDiff < 0
  const neutral = projectedNetDiff === 0 || !Number.isFinite(projectedNetDiff)
  const absProj = Math.abs(projectedNetDiff)
  const absProjStr = absProj.toFixed(2)

  return (
    <Card className="relative overflow-hidden border-emerald-500/20 bg-white shadow-lg dark:bg-slate-950/40 dark:border-emerald-500/25">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-500/[0.06] blur-3xl dark:bg-emerald-500/10"
        aria-hidden
      />
      <CardContent className="relative z-10 space-y-4 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <ArrowRightLeft className="size-3.5" strokeWidth={2.5} aria-hidden />
              </div>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Veredito do comparativo
              </h3>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Diferença na carga líquida projetada (CBS/IBS), cenário B vs referência A
              </p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span
                  className={cn(
                    "text-3xl font-bold tabular-nums tracking-tight sm:text-4xl",
                    neutral && "text-slate-700 dark:text-slate-200",
                    !neutral && savingVsA && "text-emerald-600 dark:text-emerald-400",
                    !neutral && !savingVsA && "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {neutral
                    ? formatBRL("0")
                    : `${savingVsA ? "−" : "+"}${formatBRL(absProjStr)}`}
                </span>
                {!neutral && (
                  <Badge
                    className={cn(
                      "border-0 px-2 py-0.5 text-[10px] font-semibold",
                      savingVsA && "bg-emerald-600 text-white hover:bg-emerald-600",
                      !savingVsA && "bg-amber-600 text-white hover:bg-amber-600",
                    )}
                  >
                    {savingVsA ? "Menor carga em B" : "Maior carga em B"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-[220px] space-y-3">
            {accumulatedDiff !== null && Number.isFinite(accumulatedDiff) && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Diferença acumulada (2026–2033)
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {accumulatedDiff === 0
                    ? formatBRL("0")
                    : `${accumulatedDiff < 0 ? "−" : "+"}${formatBRL(Math.abs(accumulatedDiff).toFixed(2))}`}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                  Soma ano a ano da CBS/IBS projetada (new_tax_net): B − A nos anos em comum.
                </p>
              </div>
            )}
            {strategyInsight && (
              <div className="flex items-start gap-2 px-1">
                <Zap className="mt-0.5 size-3.5 shrink-0 fill-emerald-500 text-emerald-600 dark:fill-emerald-400" />
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Insight: </span>
                  {strategyInsight}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
