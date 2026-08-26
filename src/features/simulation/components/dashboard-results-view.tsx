"use client"

// Movido de src/app/dashboard/page.tsx (FE-1, move puro) — árvore de
// resultados form (comparação A/B + esteira + CTA do dossiê).
//
// Nota de move: o `results` da página (union form|csv) e `formResults`
// (pipeline.results) são o MESMO objeto sempre que este componente é
// renderizado (o pai só renderiza quando `results?.mode === "form"`) — por
// isso os antigos `results.mode === "form" ? results.X : undefined` viram
// `formResults.X` direto aqui; não há mudança de comportamento, só remoção
// de uma checagem vestigial impossível de ser falsa neste ponto.

import { motion } from "motion/react"
import { History } from "lucide-react"
import { ScenarioComparisonBar } from "@/components/tax/scenario-comparison-bar"
import { ComparisonVerdictCard } from "@/components/tax/comparison-verdict-card"
import { SimulationResultsTopDown } from "@/components/tax/simulation-results-top-down"
import { PrivacyTrustBanner } from "@/components/tax/privacy-trust-banner"
import { BoardReadyPresentationCta } from "@/components/tax/board-ready-presentation-cta"
import { accumulatedNewTaxDiff, projectedNetTaxDiff } from "@/lib/comparison-metrics"
import { FADE_IN_VARIANTS } from "@/lib/motion-variants"
import type { ConsultantClassificationOverride, FormExpense, FormService } from "@/types/api"
import type { PersistedResults } from "@/store/useTaxStore"
import type { TribiaPlgTier, usePlgCapabilities } from "@/hooks/use-tribia-plg-tier"

type FormResults = Extract<PersistedResults, { mode: "form" }>
type PlgCapabilities = ReturnType<typeof usePlgCapabilities>

export interface DashboardResultsViewProps {
  formResults: FormResults
  cardSimulation: FormResults["simulation"] | null
  isComparing: boolean
  comparisonBaseline: FormResults | null
  clearComparison: () => void
  replaceBaselineWith: (r: FormResults) => void
  handleRequestSingleView: () => void
  handleRequestComparisonView: () => void
  plgTier: TribiaPlgTier
  plgCap: PlgCapabilities
  authLoaded: boolean
  isSignedIn: boolean | undefined
  services: FormService[]
  expenses: FormExpense[]
  companyContext: string
  focusYear: number
  setFocusYear: (year: number) => void
  boardReadyActive: boolean
  boardReadyUnlocked: boolean
  sessionCompanyLabel: string
  sessionScenarioLabel: string
  dossierBusy: boolean
  loading: boolean
  handleOpenDossier: () => void | Promise<void>
  setBoardTeaseOpen: (v: boolean) => void
  pendingSimulationSync: boolean
  isRecalculating: boolean
  onApplyOverride: (clientId: string, override: ConsultantClassificationOverride) => void
  onRemoveOverride: (clientId: string) => void
  onRequestRecalc: () => void
  shouldReduceMotion: boolean
}

export function DashboardResultsView({
  formResults,
  cardSimulation,
  isComparing,
  comparisonBaseline,
  clearComparison,
  replaceBaselineWith,
  handleRequestSingleView,
  handleRequestComparisonView,
  plgTier,
  plgCap,
  authLoaded,
  isSignedIn,
  services,
  expenses,
  companyContext,
  focusYear,
  setFocusYear,
  boardReadyActive,
  boardReadyUnlocked,
  sessionCompanyLabel,
  sessionScenarioLabel,
  dossierBusy,
  loading,
  handleOpenDossier,
  setBoardTeaseOpen,
  pendingSimulationSync,
  isRecalculating,
  onApplyOverride,
  onRemoveOverride,
  onRequestRecalc,
  shouldReduceMotion,
}: DashboardResultsViewProps) {
  return (
    <motion.div
      variants={FADE_IN_VARIANTS}
      initial={shouldReduceMotion ? "visible" : "hidden"}
      animate="visible"
      className="flex flex-col gap-6 order-1 board-ready:order-2"
    >
      {isComparing && comparisonBaseline && (
        <ScenarioComparisonBar
          baseline={comparisonBaseline}
          onAdjustParams={handleRequestSingleView}
          onCancel={clearComparison}
          onUseCurrentAsBaseline={() => replaceBaselineWith(formResults)}
          className="board-ready:hidden no-print print:hidden"
        />
      )}
      {isComparing && comparisonBaseline && (
        <div className="order-2 board-ready:order-first print:order-first">
          <ComparisonVerdictCard
            mode="comparison"
            plgTier={plgTier}
            accumulatedDiff={accumulatedNewTaxDiff(
              comparisonBaseline.simulation.transition_series,
              formResults.simulation.transition_series,
            )}
            projectedNetDiff={projectedNetTaxDiff(comparisonBaseline.simulation, formResults.simulation)}
            strategyInsight={formResults.simulation.strategy_insight}
            baselineSimulation={comparisonBaseline.simulation}
            currentSimulation={formResults.simulation}
          />
        </div>
      )}
      <div className="order-3 print:order-last board-ready:order-2">
        <SimulationResultsTopDown
          sessionStampAsideSlot={
            formResults.meta && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 board-ready:hidden print:hidden w-full sm:max-w-none">
                <div className="flex items-start justify-end gap-2.5 min-w-0 text-right sm:max-w-[24rem] sm:ml-auto">
                  <History className="h-4 w-4 shrink-0 text-accent mt-0.5" aria-hidden />
                  <div className="min-w-0 text-left sm:text-right">
                    <p className="text-xs font-semibold text-accent">Simulação do histórico</p>
                    <p className="text-xs text-muted-foreground mt-0.5 [overflow-wrap:anywhere]">
                      {new Date(formResults.meta.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}Ano {formResults.meta.year}
                      {formResults.meta.companyContext
                        ? ` · ${formResults.meta.companyContext.slice(0, 60)}${formResults.meta.companyContext.length > 60 ? "…" : ""}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            )
          }
          headerBannersSlot={<PrivacyTrustBanner plgTier={plgTier} className="w-full board-ready:hidden" />}
          showSessionOneHero={Boolean(authLoaded && isSignedIn && !isComparing)}
          showExecutiveVerdict={!isComparing}
          insightResult={cardSimulation ?? formResults.simulation}
          insightSimulationRunYear={formResults.meta?.year ?? formResults.simulation.year}
          insightOmitWhenVereditoCovers={authLoaded && isSignedIn && !isComparing}
          summaryResult={cardSimulation ?? formResults.simulation}
          summaryCompareBaseline={isComparing && comparisonBaseline ? comparisonBaseline.simulation : undefined}
          summaryOverlapAnatomy={plgCap.transitionFocusYear}
          summarySimulationRunYear={formResults.meta?.year ?? formResults.simulation.year}
          summaryHideDeltaCard={!isComparing}
          simulation={cardSimulation ?? formResults.simulation}
          aiMetadata={formResults.ai_metadata}
          classifications={formResults.classifications}
          services={services}
          expenses={expenses}
          companyContext={formResults.meta?.companyContext ?? companyContext ?? ""}
          focusYear={focusYear}
          seriesEnriched={formResults.simulation.transition_series_enriched === true}
          showTransitionAuditFactors={plgCap.transitionAuditFactors}
          presentationMode={boardReadyActive}
          sessionCompanyLabel={sessionCompanyLabel}
          resultMeta={formResults.meta}
          sessionScenarioLabel={sessionScenarioLabel}
          dossierSlot={
            <BoardReadyPresentationCta
              unlocked={boardReadyUnlocked}
              busy={dossierBusy}
              onDossier={handleOpenDossier}
              onFreeTease={() => setBoardTeaseOpen(true)}
              disabled={loading}
              className="shrink-0 board-ready:hidden no-print print:hidden"
            />
          }
          onRequestSingleView={handleRequestSingleView}
          onRequestComparisonView={handleRequestComparisonView}
          isComparing={isComparing}
          pendingSimulationSync={pendingSimulationSync}
          isRecalculating={isRecalculating}
          onApplyOverride={onApplyOverride}
          onRemoveOverride={onRemoveOverride}
          onRequestRecalc={onRequestRecalc}
          transitionUi={{
            chartResult: formResults.simulation,
            abBaselineResult: isComparing && comparisonBaseline ? comparisonBaseline.simulation : undefined,
            transitionFocusYear: plgCap.transitionFocusYear,
            transitionFullChart: plgCap.transitionFullChart,
            transitionAuditFactors: plgCap.transitionAuditFactors,
            transitionDynamicInsights: plgCap.transitionDynamicInsights,
            onFocusYearChange: setFocusYear,
          }}
        />
      </div>
    </motion.div>
  )
}
