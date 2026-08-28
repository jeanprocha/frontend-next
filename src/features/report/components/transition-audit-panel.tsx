"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TransitionAuditPanelBody } from "./transition-audit-panel-body"
import { cn } from "@/lib/utils"
import type { TransitionSeriesPoint } from "@/types/api"

interface TransitionAuditPanelProps {
  focusYear: number
  point: TransitionSeriesPoint | undefined
  /** Série reconstituída no GET (registo antigo); breakdown rico só após nova simulação gravada. */
  seriesEnriched?: boolean
  className?: string
}

export function TransitionAuditPanel({
  focusYear,
  point,
  seriesEnriched,
  className,
}: TransitionAuditPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    // print:hidden: este painel é um collapsible que começa fechado — o
    // conteúdo só entra no DOM quando aberto ({open && ...} abaixo), então
    // nunca pode ser o que sustenta a impressão. CalculationTracePrint é o
    // gêmeo sempre-visível que faz esse papel (ver o comentário nele).
    <div className={cn("rounded-lg border border-border/70 bg-muted/15 print:hidden", className)}>
      <Button
        type="button"
        variant="ghost"
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>Memória de cálculo — {focusYear}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </Button>
      {open && (
        <div className="border-t border-border/60 px-3 py-3">
          <TransitionAuditPanelBody
            focusYear={focusYear}
            point={point}
            seriesEnriched={seriesEnriched}
            showFactorTooltips={false}
          />
        </div>
      )}
    </div>
  )
}
