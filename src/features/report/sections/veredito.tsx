"use client"

import { FinancialVerdictHeroCard } from "../components/financial-verdict-hero-card"
import { VerdictThesisPanel } from "../components/verdict-thesis-panel"
import { ComparisonVerdictCard } from "../components/comparison-verdict-card"
import { TribiaInsights } from "../components/tribia-insights"
import { cn } from "@/lib/utils"
import { useReportDisplaySimulation } from "../lib/use-report-display-simulation"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function VereditoSection({ record, mode, focusYear, comparison, overrides, onNavigateToTab }: ReportSectionProps) {
  const presentationMode = mode !== "screen-tabs"
  const { aiMetadata, classifications, expenses } = record
  const isComparing = Boolean(comparison)
  const displaySimulation = useReportDisplaySimulation(record.simulation, focusYear)

  const thesisIsStale =
    classifications.some((c) => Boolean(c.consultant_override)) &&
    Boolean(record.simulation.strategy_insight?.trim())

  if (isComparing) {
    return (
      <section
        id="veredito-executivo"
        aria-labelledby="tribia-veredito-comparativo-note"
        className="scroll-mt-36 break-inside-avoid border-0 bg-transparent shadow-none print:bg-transparent p-5 sm:p-6 print:p-0"
      >
        <h2
          id="tribia-veredito-comparativo-note"
          className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          <span
            aria-hidden
            className="mr-2 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground"
          >
            1
          </span>
          Veredito
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          No modo comparação A/B, o veredito comparativo encontra-se no topo da página.
        </p>
      </section>
    )
  }

  return (
    <section
      id="veredito-executivo"
      aria-labelledby="tribia-fvh-title"
      className={cn(
        presentationMode
          ? "scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent"
          : "scroll-mt-36 break-inside-avoid border-0 bg-transparent shadow-none print:bg-transparent",
        "p-5 sm:p-6 print:p-0",
      )}
    >
      <div
        className={cn(
          "mb-6 grid grid-cols-1 gap-6",
          "md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:items-stretch",
          "print:mb-4 print:grid-cols-1 print:gap-4",
          "board-ready:grid-cols-1 board-ready:gap-4",
        )}
      >
        <FinancialVerdictHeroCard
          simulation={displaySimulation}
          focusYear={focusYear}
          presentationMode={presentationMode}
          isRecalculating={overrides?.isRecalculating}
          pendingSimulationSync={overrides?.pendingSimulationSync}
        />
        <VerdictThesisPanel
          markdown={record.simulation.strategy_insight}
          scoreRaw={aiMetadata?.confidence_score}
          evidenceCoverageRaw={
            aiMetadata?.breakdown?.evidence_coverage != null &&
            Number.isFinite(aiMetadata.breakdown.evidence_coverage)
              ? aiMetadata.breakdown.evidence_coverage
              : null
          }
          presentationMode={presentationMode}
          pending={false}
          thesisIsStale={thesisIsStale}
          isRecalculating={overrides?.isRecalculating}
          pendingSimulationSync={overrides?.pendingSimulationSync}
        />
      </div>
      <ComparisonVerdictCard
        mode="single"
        layout="cockpit"
        currentSimulation={displaySimulation}
        strategyInsight={record.simulation.strategy_insight}
        ragSources={aiMetadata?.sources_analyzed ?? null}
        onEsteiraTabChange={onNavigateToTab}
        aiMetadata={aiMetadata}
        classifications={classifications}
        expenses={expenses}
        executiveThesisDisplayed={Boolean(record.simulation.strategy_insight?.trim())}
        insightSlot={
          <TribiaInsights
            result={displaySimulation}
            simulationRunYear={record.meta?.year ?? record.simulation.year}
            omitWhenVereditoCovers={mode !== "public-linear"}
          />
        }
      />
    </section>
  )
}

export const vereditoSection: ReportSection = {
  id: "veredito",
  title: "Veredito financeiro",
  print: "always",
  screenTab: "veredito",
  Component: VereditoSection,
}
