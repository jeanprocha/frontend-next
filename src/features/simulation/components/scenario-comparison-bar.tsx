"use client"

import { ArrowLeftRight, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatRegimeLabel } from "@/lib/comparison-metrics"
import type { PersistedResults } from "@/lib/persisted-results"

interface ScenarioComparisonBarProps {
  baseline: PersistedResults
  currentLabel?: "reference" | "current"
  onAdjustParams: () => void
  onCancel: () => void
  onUseCurrentAsBaseline?: () => void
  className?: string
}

export function ScenarioComparisonBar({
  baseline,
  onAdjustParams,
  onCancel,
  onUseCurrentAsBaseline,
  className,
}: ScenarioComparisonBarProps) {
  const regimeA = formatRegimeLabel(baseline.simulation.company_regime)
  const yearA = baseline.simulation.year

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-slate-950/90 p-2 text-slate-100 shadow-sm dark:border-slate-700",
        className,
      )}
      role="region"
      aria-label="Comparação de cenários ativa"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
          <ArrowLeftRight className="size-4 shrink-0 text-emerald-400" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Comparação A/B ativa
            </p>
            <p className="truncate text-xs text-slate-200">
              Referência (A): ano {yearA} · {regimeA}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
          {onUseCurrentAsBaseline && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onUseCurrentAsBaseline}
              className="h-8 border border-slate-600/80 bg-slate-800/80 text-xs font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              Usar B como referência
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAdjustParams}
            className="h-8 gap-1 text-xs font-semibold uppercase tracking-wide text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Pencil className="size-3" aria-hidden />
            Ajustar parâmetros
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 gap-1 text-xs font-semibold uppercase tracking-wide text-red-300 hover:bg-red-950/50 hover:text-red-200"
          >
            <X className="size-3" aria-hidden />
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
