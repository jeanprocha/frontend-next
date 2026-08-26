"use client"

import { SummaryCards } from "@/components/tax/summary-cards"
import { useReportDisplaySimulation } from "../lib/use-report-display-simulation"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function AnatomiaSection({ record, focusYear, comparison }: ReportSectionProps) {
  const displaySimulation = useReportDisplaySimulation(record.simulation, focusYear)
  return (
    <section
      id="tribia-journey-dados"
      className="scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent"
    >
      <div className="p-5 sm:p-6 print:p-0">
        <div className="mb-4 flex items-center gap-2.5 print:mb-3">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground"
          >
            Anatomia do resultado
          </h2>
        </div>
        <SummaryCards
          result={displaySimulation}
          compareBaseline={comparison?.baseline.simulation}
          overlapAnatomy
          simulationRunYear={record.meta?.year ?? record.simulation.year}
          hideDeltaCard={!comparison}
        />
      </div>
    </section>
  )
}

export const anatomiaSection: ReportSection = {
  id: "anatomia",
  title: "Anatomia do resultado",
  capability: "transitionFocusYear",
  print: "always",
  screenTab: "cronograma",
  Component: AnatomiaSection,
}
