"use client"

import { Download, Lock } from "lucide-react"
import { useCapability } from "@/features/plg"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { buildAuditCsv } from "@/lib/build-audit-csv"
import type { ClassificationItem, FormExpense } from "@/types/api"

/**
 * "Exportar CSV" — Etapa M/PR 7. Gated por `boardReadyUnlocked` (mesma
 * capability que já desbloqueia o dossiê digital e o modo apresentação):
 * é a capability de "recursos avançados do dossiê" que a base de código já
 * usa como o portão Pro natural aqui, sem introduzir uma flag nova só para
 * esta feature pequena.
 */
export function ExportAuditCsvButton({
  expenses,
  classifications,
}: {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
}) {
  const unlocked = useCapability("boardReadyUnlocked")

  function handleExport() {
    const csv = buildAuditCsv(expenses, classifications)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "tribia-classificacao-auditoria.csv"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const buttonClass = cn(
    "tribia-touch-target inline-flex min-h-8 items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium transition-colors print:hidden",
    unlocked
      ? "text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5"
      : "cursor-not-allowed text-muted-foreground/60",
  )

  if (!unlocked) {
    return (
      <Tooltip>
        <TooltipTrigger type="button" disabled className={buttonClass} aria-label="Exportar CSV — disponível no plano Pro">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          Exportar CSV
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-56 text-xs leading-snug">
          Exportação CSV audit-ready disponível no plano Pro.
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <button type="button" onClick={handleExport} className={buttonClass}>
      <Download className="size-3.5 shrink-0" aria-hidden />
      Exportar CSV
    </button>
  )
}
