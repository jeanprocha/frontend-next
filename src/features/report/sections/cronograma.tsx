"use client"

import dynamic from "next/dynamic"
import { TransitionGoPeaksMarcos } from "../components/transition-go-peaks-marcos"
import { Skeleton } from "@/components/ui/skeleton"
import { useCapability } from "@/features/plg"
import { PRINT_PENDING_ATTR } from "@/lib/print-readiness"
import { cn } from "@/lib/utils"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

// D3 — marcado como "impressão pendente" (ver lib/print-readiness.ts):
// usePrintFullDocument espera este marcador sumir do DOM antes de
// window.print(), para não imprimir o esqueleto de um gráfico lazy que
// ainda não carregou.
function ChartSankeySkeleton() {
  return (
    <div {...{ [PRINT_PENDING_ATTR]: "" }}>
      <Skeleton className="h-[min(360px,50vh)] w-full min-h-[200px] rounded-xl" />
    </div>
  )
}

const TransitionChartLazy = dynamic(
  () => import("../components/transition-chart").then((m) => m.TransitionChart),
  { ssr: false, loading: () => <ChartSankeySkeleton /> },
)

const SankeyFlowLazy = dynamic(
  () => import("../components/sankey-flow").then((m) => m.SankeyFlow),
  { ssr: false, loading: () => <ChartSankeySkeleton /> },
)

/**
 * D2/Frente D — os chips deixaram de ser decorativos: são atalhos VIVOS
 * para o ano de foco, ligados ao mesmo onFocusYearChange do controle
 * canônico (focus-year-control.tsx) — nunca um controle "fake" ao lado do
 * de verdade. O slider decorativo (trilho + bolinha sem interação) que
 * existia aqui foi removido — não fazia nada além de parecer clicável.
 */
/** Exportado para teste direto (cronograma.test.tsx) — evita montar a árvore pesada de CronogramaSection (gráficos lazy, capacidades PLG). */
export function MotorGoTransitionTimeline({
  years,
  focusYear,
  onFocusYearChange,
}: {
  years: number[]
  focusYear: number
  onFocusYearChange?: (year: number) => void
}) {
  const sorted = [...years].sort((a, b) => a - b)

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Série de transição
      </p>
      <ul
        className="flex flex-wrap items-center gap-2 print:hidden"
        role={onFocusYearChange ? "group" : undefined}
        aria-label={onFocusYearChange ? "Atalhos de ano de foco" : undefined}
      >
        {sorted.map((y) => {
          const isFocus = y === focusYear
          const chipClass = cn(
            "inline-flex min-w-[3.25rem] justify-center rounded-md border px-2 py-1.5 font-mono tabular-nums transition-colors",
            isFocus
              ? "border-emerald-600/60 bg-emerald-600/15 text-sm font-semibold text-foreground ring-2 ring-emerald-500/25"
              : "border-border/60 bg-muted/30 text-[11px] text-muted-foreground",
          )
          return (
            <li key={y}>
              {onFocusYearChange ? (
                <button
                  type="button"
                  onClick={() => onFocusYearChange(y)}
                  aria-pressed={isFocus}
                  aria-label={`Focar no ano ${y}`}
                  className={cn(
                    chipClass,
                    "cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                  )}
                >
                  {y}
                </button>
              ) : (
                <span className={chipClass}>{y}</span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] leading-snug text-muted-foreground print:hidden">
        Atalho para o ano de foco — o mesmo controle do topo do documento. Os valores desta aba são reprodutíveis
        para o ano escolhido e auditáveis externamente.
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
            Cronograma de impacto
          </h2>
        </div>
        {series && series.length > 0 && (
          <div className="mb-5">
            <MotorGoTransitionTimeline
              years={series.map((p) => p.year)}
              focusYear={focusYear}
              onFocusYearChange={onFocusYearChange}
            />
          </div>
        )}
        <div className="mb-5">
          <TransitionChartLazy
            result={simulation}
            abBaselineResult={comparison?.baseline.simulation}
            chartMode={transitionFullChart ? "full" : "sparkline"}
            focusYear={focusYear}
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
