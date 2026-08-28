"use client"

import dynamic from "next/dynamic"
import { TransitionGoPeaksMarcos } from "../components/transition-go-peaks-marcos"
import { Skeleton } from "@/components/ui/skeleton"
import { useCapability } from "@/features/plg"
import { cn } from "@/lib/utils"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function ChartSankeySkeleton() {
  return <Skeleton className="h-[min(360px,50vh)] w-full min-h-[200px] rounded-xl" />
}

const TransitionChartLazy = dynamic(
  () => import("../components/transition-chart").then((m) => m.TransitionChart),
  { ssr: false, loading: () => <ChartSankeySkeleton /> },
)

const SankeyFlowLazy = dynamic(
  () => import("../components/sankey-flow").then((m) => m.SankeyFlow),
  { ssr: false, loading: () => <ChartSankeySkeleton /> },
)

function MotorGoTransitionTimeline({ years, focusYear }: { years: number[]; focusYear: number }) {
  const sorted = [...years].sort((a, b) => a - b)
  const minY = sorted[0] ?? focusYear
  const maxY = sorted[sorted.length - 1] ?? focusYear
  const span = Math.max(1, maxY - minY)
  const focusPos = sorted.length ? ((focusYear - minY) / span) * 100 : 50

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Série de transição 2026–2033
      </p>
      <div className="relative pt-1">
        <div className="h-1.5 rounded-full bg-muted" aria-hidden />
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-600 bg-card shadow-sm"
          style={{ left: `${Math.min(100, Math.max(0, focusPos))}%` }}
          title={`Ano de foco ${focusYear} na rampa`}
          aria-hidden
        />
      </div>
      <ul className="flex flex-wrap items-center gap-2">
        {sorted.map((y) => {
          const isFocus = y === focusYear
          return (
            <li key={y}>
              <span
                className={cn(
                  "inline-flex min-w-[3.25rem] justify-center rounded-md border px-2 py-1 font-mono tabular-nums transition-colors",
                  isFocus
                    ? "border-emerald-600/60 bg-emerald-600/15 text-sm font-semibold text-foreground ring-2 ring-emerald-500/25"
                    : "border-border/60 bg-muted/30 text-[11px] text-muted-foreground",
                )}
              >
                {y}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] leading-snug text-muted-foreground">
        O ano de foco posiciona-se na rampa de convivência entre regimes; os valores desta aba são reprodutíveis para
        esse ano e auditáveis externamente.
      </p>
    </div>
  )
}

function CronogramaSection({ record, mode, focusYear, onFocusYearChange, comparison, overrides }: ReportSectionProps) {
  const presentationMode = mode !== "screen-tabs"
  const transitionFullChart = useCapability("transitionFullChart")
  const { simulation } = record
  const series = simulation.transition_series

  return (
    <section
      id="tribia-journey-transicao"
      className="scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent"
    >
      <div className="p-5 sm:p-6 print:p-0">
        <div className="mb-4 flex items-center gap-2.5 print:mb-3">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden"
          >
            2
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground">
            Cronograma de Impacto (Motor Go)
          </h2>
        </div>
        {series && series.length > 0 && (
          <div className="mb-5">
            <MotorGoTransitionTimeline years={series.map((p) => p.year)} focusYear={focusYear} />
          </div>
        )}
        <div className="mb-5">
          <TransitionChartLazy
            result={simulation}
            abBaselineResult={comparison?.baseline.simulation}
            chartMode={transitionFullChart ? "full" : "sparkline"}
            focusYear={focusYear}
            onFocusYearChange={onFocusYearChange}
            presentationMode={presentationMode}
            isRecalculating={overrides?.isRecalculating}
            pendingSimulationSync={overrides?.pendingSimulationSync}
          />
        </div>
        {series && series.length > 0 && (
          <div className="mb-5">
            <TransitionGoPeaksMarcos series={series} focusYear={focusYear} />
          </div>
        )}
        {transitionFullChart && (
          <div className="mb-5">
            <SankeyFlowLazy simulation={simulation} expenses={record.expenses} services={record.services} />
          </div>
        )}
      </div>
    </section>
  )
}

export const cronogramaSection: ReportSection = {
  id: "cronograma",
  title: "Cronograma de impacto",
  print: "always",
  screenTab: "cronograma",
  Component: CronogramaSection,
}
