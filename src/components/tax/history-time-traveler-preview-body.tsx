"use client"

import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { TransitionSparkline } from "@/components/tax/transition-sparkline"
import { formatBRL } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import type { SimulationRecordSummary } from "@/types/api"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export interface HistoryTimeTravelerPreviewBodyProps {
  row: SimulationRecordSummary
  isThisLoading: boolean
  onOpenInSimulator: () => void | Promise<void>
  /** Pro: sparkline + insight; Free: mensagem de upgrade. */
  variant: "pro" | "free-tease"
  onDismiss?: () => void
}

export function HistoryTimeTravelerPreviewBody({
  row,
  isThisLoading,
  onOpenInSimulator,
  variant,
  onDismiss,
}: HistoryTimeTravelerPreviewBodyProps) {
  const deltaNum = parseFloat(row.delta_impact)
  const deltaNeutral = !Number.isFinite(deltaNum) || deltaNum === 0
  const deltaSaving = deltaNum < 0

  if (variant === "free-tease") {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Time-Traveler
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          No plano Pro vê a trajetória 2026–2033, o veredito resumido e compara dois cenários a partir do histórico.
        </p>
        <Link
          href="/#planos"
          onClick={() => onDismiss?.()}
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full justify-center")}
        >
          Ver planos
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isThisLoading}
          onClick={() => void onOpenInSimulator()}
        >
          Abrir no simulador
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Time-Traveler
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(row.created_at)} · Ano {row.year}
        </p>
        {row.company_context ? (
          <p className="text-sm mt-2 leading-snug">{truncate(row.company_context, 140)}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
          Carga CBS/IBS (2026–2033)
        </p>
        <div className="flex justify-center py-1">
          <TransitionSparkline series={row.transition_series} width={200} height={40} />
        </div>
      </div>

      {row.strategy_insight ? (
        <p className="text-xs leading-relaxed text-foreground/85 border-t border-border/50 pt-2">
          {truncate(row.strategy_insight, 280)}
        </p>
      ) : null}

      <div className="border-t border-border/60 pt-3 space-y-2">
        <div>
          <span className="text-muted-foreground text-xs">Projetado líquido </span>
          <span className="font-mono font-semibold tabular-nums">{formatBRL(row.total_projected_tax)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground text-xs">Δ impacto</span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-full",
              deltaNeutral
                ? "bg-muted/60 text-muted-foreground"
                : deltaSaving
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
            )}
          >
            {deltaNeutral ? "→ " : deltaSaving ? "↓ " : "↑ "}
            {formatBRL(row.delta_impact)}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Abra no simulador para rever classificações, créditos e o painel completo.
      </p>
      <Button
        type="button"
        size="sm"
        className="w-full tribia-touch-target sm:min-h-9"
        disabled={isThisLoading}
        onClick={() => void onOpenInSimulator()}
      >
        Abrir no simulador
      </Button>
    </div>
  )
}
