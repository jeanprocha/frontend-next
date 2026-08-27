"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"

export interface SimulationSessionAuthorityStampProps {
  /** Label de identificação da empresa/contexto — derivado pelo pai com heurística. */
  sessionCompanyLabel: string
  /** Label do cenário activo (simulação única, A/B, ano). */
  sessionScenarioLabel: string
  className?: string
}

/**
 * Carimbo de autoridade de sessão — identifica empresa e cenário activos
 * no topo do dossiê Top-Down (item 1.2.1).
 *
 * Puramente informativo: zero lógica fiscal ou numérica ("IA explica; Go calcula").
 * Oculto em Board-Ready (cabeçalho serif do relatório tem identificação própria)
 * e na impressão (masthead do PrintReportHeader assume esse papel).
 *
 * Usa React.memo com props primitivas para não re-renderizar durante o scroll do grid.
 */
export const SimulationSessionAuthorityStamp = memo(
  function SimulationSessionAuthorityStamp({
    sessionCompanyLabel,
    sessionScenarioLabel,
    className,
  }: SimulationSessionAuthorityStampProps) {
    return (
      <div
        role="region"
        aria-label="Identificação da sessão de simulação"
        className={cn(
          "flex min-w-0 items-center gap-3 py-2.5",
          "board-ready:hidden print:hidden",
          className,
        )}
      >
        {/* Selo emerald 2px — assinatura whisper-quiet de sessão PRO (system.md: cor com significado) */}
        <span
          aria-hidden
          className="h-7 w-0.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
        />

        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
          {/* Empresa */}
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Empresa
            </span>
            <span
              className="min-w-0 max-w-[200px] truncate text-xs font-medium text-foreground sm:max-w-[300px]"
              title={sessionCompanyLabel}
            >
              {sessionCompanyLabel}
            </span>
          </div>

          {/* Separador visual — desktop only */}
          <span aria-hidden className="hidden shrink-0 text-[10px] text-border/70 sm:inline">
            ·
          </span>

          {/* Cenário */}
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Cenário
            </span>
            <span
              className="min-w-0 max-w-[180px] truncate text-xs font-medium text-foreground sm:max-w-[260px]"
              title={sessionScenarioLabel}
            >
              {sessionScenarioLabel}
            </span>
          </div>
        </div>
      </div>
    )
  },
)
