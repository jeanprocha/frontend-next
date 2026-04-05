"use client"

import { useMemo } from "react"
import { AlertCircle, ChevronDown, Lightbulb } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatBRL } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { SimulationResponse } from "@/types/api"

interface CreditLeakageAlertProps {
  result: SimulationResponse
}

export function CreditLeakageAlert({ result }: CreditLeakageAlertProps) {
  const leaks = result.credit_leaks ?? []

  const totalLost = useMemo(() => {
    return leaks.reduce((acc, leak) => {
      const n = parseFloat(leak.lost_credit || "0")
      return acc + (Number.isFinite(n) ? n : 0)
    }, 0)
  }, [leaks])

  if (leaks.length === 0) return null

  return (
    <div className="mt-6 space-y-4">
      <div
        className={cn(
          "rounded-lg border px-4 py-3",
          "border-[#f59e0b] bg-[#fffbeb] text-[#92400e]",
          "dark:border-amber-700 dark:bg-amber-950/35 dark:text-amber-100",
        )}
      >
        <div className="flex flex-wrap items-start gap-2">
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-[#d97706] dark:text-amber-400"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">Vazamento de créditos (ilustrativo)</p>
              <Badge
                variant="outline"
                className="border-[#d97706] bg-white/80 text-[#92400e] dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-100"
              >
                Prejuízo evitável {formatBRL(totalLost.toFixed(2))}
              </Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              Há despesas classificadas como inelegíveis que, se elegíveis no modelo TribIA,
              gerariam crédito de CBS/IBS na alíquota do regime indicado. Veja sugestões abaixo
              (não substituem assessoria).
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card text-card-foreground">
        {leaks.map((leak, index) => (
          <details
            key={`${leak.description}-${index}`}
            className="group border-b border-border last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{leak.description}</p>
                <p className="text-xs text-muted-foreground">
                  Valor da despesa: {formatBRL(leak.value)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                −{formatBRL(leak.lost_credit)}
              </span>
            </summary>
            <div className="grid gap-3 border-t border-border bg-muted/20 px-4 py-3 md:grid-cols-2">
              <div className="rounded-md border border-border bg-background p-3">
                <h4 className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <AlertCircle className="size-3" />
                  Motivo (modelo)
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {leak.reason?.trim() || "—"}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-md border p-3",
                  "border-[#86efac] bg-[#f0fdf4] dark:border-emerald-800 dark:bg-emerald-950/40",
                )}
              >
                <h4 className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                  <Lightbulb className="size-3" />
                  Sugestão
                </h4>
                <p className="text-sm font-medium leading-relaxed text-emerald-950 dark:text-emerald-100">
                  {leak.fix?.trim() || "—"}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
