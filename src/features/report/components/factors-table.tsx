"use client"

import type { ReactNode } from "react"
import {
  factorTransitionAuditTooltip,
  issModelDisplayLabel,
  type FactorAuditKind,
} from "@/lib/transition-audit-copy"
import { formatRegulatoryFactorDisplay } from "../lib/format-regulatory-factor"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { TransitionYearFactors } from "@/types/api"

/**
 * Extraído de transition-audit-panel-body.tsx (Etapa C, W2/PR3) — o arquivo
 * original passou de 300 linhas com a decomposição por tributo (achado 12,
 * DoD por módulo).
 */
export function FactorValue({
  children,
  tooltip,
  enabled,
  className,
}: {
  children: ReactNode
  tooltip: string
  enabled: boolean
  className?: string
}) {
  const mono = cn("font-mono", className)
  if (!enabled) {
    return <span className={mono}>{children}</span>
  }
  return (
    <Tooltip>
      <TooltipTrigger type="button" className={cn(mono, "inline cursor-help border-0 bg-transparent p-0 text-left")}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-xs leading-snug">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export function FactorsTable({
  focusYear,
  f,
  showTooltips,
}: {
  focusYear: number
  f: TransitionYearFactors
  showTooltips: boolean
}) {
  const rows: { label: string; display: string; kind: FactorAuditKind }[] = [
    { label: "PIS/COFINS (manutenção no legado)", display: formatRegulatoryFactorDisplay(f.pis_cofins_factor), kind: "pis_cofins" },
    {
      label: "ISS municipal (sobre a alíquota informada)",
      display:
        f.iss_municipal_factor == null || String(f.iss_municipal_factor).trim() === ""
          ? "—"
          : formatRegulatoryFactorDisplay(f.iss_municipal_factor),
      kind: "iss_municipal",
    },
    { label: "CBS (referência)", display: formatRegulatoryFactorDisplay(f.cbs_rate), kind: "cbs" },
    { label: "IBS (referência)", display: formatRegulatoryFactorDisplay(f.ibs_rate), kind: "ibs" },
  ]
  if (f.combined_projected_rate) {
    rows.push({ label: "CBS + IBS (referência combinada)", display: formatRegulatoryFactorDisplay(f.combined_projected_rate), kind: "combined" })
  }
  if (f.iss_model) {
    rows.push({ label: "Modelo ISS", display: issModelDisplayLabel(f.iss_model), kind: "iss_model" })
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Fatores de transição e alíquotas de referência
      </p>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Fatores de transição e alíquotas de referência para o ano {focusYear}</caption>
        <thead>
          <tr className="border-b border-border/60 text-muted-foreground">
            <th className="py-1 pr-2 font-medium">Parâmetro</th>
            <th className="py-1 font-mono">Valor aplicado</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row, i) => (
            <tr key={row.label} className={cn(i < 2 ? "bg-muted/30" : undefined)}>
              <td className={cn("py-0.5 pr-2", i < 2 && "font-medium")}>{row.label}</td>
              <td>
                <FactorValue enabled={showTooltips} tooltip={factorTransitionAuditTooltip(focusYear, row.kind)}>
                  {row.display}
                </FactorValue>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Reutilizado por quem monta tooltip de célula fora desta tabela (ver calculation-trace-panel.tsx). */
export function gridCellTooltip(focusYear: number, label: string): string {
  return `Valor determinístico do motor Go para ${focusYear} — ${label}. Sem float64 na conta central.`
}
