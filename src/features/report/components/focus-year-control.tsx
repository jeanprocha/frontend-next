"use client"

// D2/Frente D — controle CANÔNICO de ano de foco: "eu conseguir selecionar
// o ano, e isso refletir em todo o resultado, e não ter que selecionar o
// ano várias vezes em lugares diferentes" (palavras do dono do produto).
// Único componente que existe para mudar o ano — screen-tabs, board e
// public-linear montam a MESMA instância via report-renderer.tsx, todos
// chamando o mesmo onFocusYearChange que já propaga a focusYear em todo o
// documento (report-contract.ts). Trocar o ano é releitura da série já
// calculada (lib/transition-focus.ts, use-report-display-simulation.ts) —
// nunca dispara nova classificação por IA.
import { cn } from "@/lib/utils"

export interface FocusYearControlProps {
  /** Derivado da transition_series do registro — nunca hardcodar 2026–2033 (lib/transition-focus.ts). */
  years: number[]
  focusYear: number
  onFocusYearChange: (year: number) => void
  className?: string
}

export function FocusYearControl({ years, focusYear, onFocusYearChange, className }: FocusYearControlProps) {
  if (years.length === 0) return null

  return (
    <div className={cn("flex items-center gap-2 print:hidden", className)}>
      <label
        htmlFor="tribia-focus-year-control"
        className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground board-ready:text-xs"
      >
        Ano de foco
      </label>
      <select
        id="tribia-focus-year-control"
        value={focusYear}
        onChange={(e) => onFocusYearChange(Number(e.target.value))}
        className={cn(
          "tribia-touch-target rounded-md border border-input bg-background px-2.5 text-sm font-semibold tabular-nums text-foreground shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        )}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}
