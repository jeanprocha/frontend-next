"use client"

import type { MouseEvent } from "react"
import { cn } from "@/lib/utils"

/** IDs semânticos — cockpit: veredito → esteira (tabs) → mesa. */
export const SIMULATION_RESULTS_ANCHORS = {
  veredito: "veredito-executivo",
  cronograma: "tribia-journey-transicao",
  dossie: "tribia-dossie-auditoria",
  mesa: "tribia-mesa-operacoes",
} as const

export type SimulationResultsAnchorKey = keyof typeof SIMULATION_RESULTS_ANCHORS

const ITEMS: { key: SimulationResultsAnchorKey; label: string; step: number }[] = [
  { key: "veredito", label: "Veredito", step: 1 },
  { key: "cronograma", label: "Cronograma", step: 2 },
  { key: "dossie", label: "Dossiê RAG", step: 3 },
  { key: "mesa", label: "Mesa", step: 4 },
]

export interface SimulationResultsStickyIndexProps {
  className?: string
  activeTab?: SimulationResultsAnchorKey
  onChangeTab?: (key: SimulationResultsAnchorKey) => void
}

/**
 * Navegação para o dossiê de resultados (agora funcionando como Abas Mestre).
 * Oculto em Board-Ready e impressão.
 */
export function SimulationResultsStickyIndex({
  className,
  activeTab = "veredito",
  onChangeTab,
}: SimulationResultsStickyIndexProps) {
  const handleClick = (key: SimulationResultsAnchorKey, e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (onChangeTab) {
      onChangeTab(key)
    }
  }

  return (
    <nav
      aria-label="Navegação do dossiê de resultados"
      className={cn("print:hidden board-ready:hidden", className)}
    >
      <div className="flex w-full min-h-0 border-b border-border/80 bg-transparent px-0 sm:px-0">
        <ol
          className="m-0 flex w-full min-h-0 list-none items-end gap-0.5 p-0 sm:gap-0.5"
          role="list"
        >
          {ITEMS.map(({ key, label, step }) => {
            const isActive = activeTab === key

            return (
              <li key={key} className="flex min-w-0 flex-1">
                <button
                  type="button"
                  title={label}
                  onClick={(e) => handleClick(key, e)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative z-0 flex w-full min-h-11 min-w-0 items-center justify-center gap-1.5 px-1 py-2.5 text-center sm:gap-2 sm:px-2 sm:py-3",
                    "rounded-t-md border border-b-0 sm:rounded-t-lg",
                    "text-[10px] font-semibold tracking-wide transition-colors outline-none",
                    "sm:text-[11px]",
                    "focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                    isActive
                      ? "z-[1] border-border/60 bg-card/90 text-foreground"
                      : [
                          "border-transparent text-muted-foreground",
                          "hover:border-border/50 hover:bg-muted/25 hover:text-foreground",
                        ],
                  )}
                  style={isActive ? { marginBottom: "-1px" } : undefined}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full font-mono text-[9px] sm:text-[11px] font-bold tabular-nums transition-all",
                      isActive
                        ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                        : "bg-muted/80 text-muted-foreground",
                    )}
                  >
                    {step}
                  </span>
                  <span className="min-w-0 text-center [overflow-wrap:anywhere] sm:text-xs">
                    {label.toUpperCase()}
                  </span>
                  {isActive ? (
                    <span
                      className="pointer-events-none absolute bottom-0 left-1.5 right-1.5 h-0.5 rounded-full bg-emerald-500/90 sm:left-2 sm:right-2 dark:bg-emerald-400/90"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
