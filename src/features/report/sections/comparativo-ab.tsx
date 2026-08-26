"use client"

import { ComparisonVerdictCard } from "@/components/tax/comparison-verdict-card"
import { accumulatedNewTaxDiff, projectedNetTaxDiff } from "@/lib/comparison-metrics"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function ComparativoABSection({ record, comparison }: ReportSectionProps) {
  if (!comparison) return null
  return (
    <div className="order-2 board-ready:order-first print:order-first">
      <ComparisonVerdictCard
        mode="comparison"
        accumulatedDiff={accumulatedNewTaxDiff(
          comparison.baseline.simulation.transition_series,
          record.simulation.transition_series,
        )}
        projectedNetDiff={projectedNetTaxDiff(comparison.baseline.simulation, record.simulation)}
        strategyInsight={record.simulation.strategy_insight}
        baselineSimulation={comparison.baseline.simulation}
        currentSimulation={record.simulation}
      />
    </div>
  )
}

export const comparativoABSection: ReportSection = {
  id: "comparativo-ab",
  title: "Comparativo A/B",
  print: "always",
  screenTab: "veredito",
  Component: ComparativoABSection,
}
