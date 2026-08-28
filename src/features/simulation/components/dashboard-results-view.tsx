"use client"

// Movido de src/app/dashboard/page.tsx (FE-1, move puro) — construtor do
// ReportRenderInput a partir do estado ao vivo da máquina + store (FE-2 PR
// 2c). O registry (features/report) é injectado via renderDossier — nunca
// importado directamente daqui (simulation ↛ report, lint de fronteira).

import type { ReactNode } from "react"
import { motion } from "motion/react"
import { History } from "lucide-react"
import { ScenarioComparisonBar } from "./scenario-comparison-bar"
import { PrivacyTrustBanner } from "./privacy-trust-banner"
import { BoardReadyPresentationCta } from "./board-ready-presentation-cta"
import { FADE_IN_VARIANTS } from "../lib/motion-variants"
import { useTaxStore } from "@/store/useTaxStore"
import { useTribiaBranding } from "@/features/plg"
import { buildSimulationRecord } from "../lib/build-simulation-record"
import type { ConsultantClassificationOverride, FormExpense, FormService } from "@/types/api"
import type { PersistedResults } from "@/lib/persisted-results"
import type { ReportRenderInput } from "@/lib/report-contract"

type FormResults = Extract<PersistedResults, { mode: "form" }>

export interface DashboardResultsViewProps {
  formResults: FormResults
  isComparing: boolean
  comparisonBaseline: FormResults | null
  clearComparison: () => void
  replaceBaselineWith: (r: FormResults) => void
  handleRequestSingleView: () => void
  services: FormService[]
  expenses: FormExpense[]
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
  /** Etapa M/PR 8 — mensagem da última falha de recálculo, já formatada. */
  recalcErrorMessage?: string | null
  onApplyOverride: (clientId: string, override: ConsultantClassificationOverride) => void
  onRemoveOverride: (clientId: string) => void
  onRequestRecalc: () => void
  shouldReduceMotion: boolean
  renderDossier: (input: Omit<ReportRenderInput, "sections">) => ReactNode
}

export function DashboardResultsView({
  formResults,
  isComparing,
  comparisonBaseline,
  clearComparison,
  replaceBaselineWith,
  handleRequestSingleView,
  services,
  expenses,
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
  recalcErrorMessage,
  onApplyOverride,
  onRemoveOverride,
  onRequestRecalc,
  shouldReduceMotion,
  renderDossier,
}: DashboardResultsViewProps) {
  const companyRegime = useTaxStore((s) => s.companyRegime)
  const { brandingLogoUrl, brandingOrgName } = useTribiaBranding()

  const record = buildSimulationRecord(formResults, services, expenses, companyRegime, {
    logo_url: brandingLogoUrl,
    org_name: brandingOrgName,
  })

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
      <div className="order-3 print:order-last board-ready:order-2">
        {renderDossier({
          record,
          mode: boardReadyActive ? "board" : "screen-tabs",
          focusYear,
          onFocusYearChange: setFocusYear,
          overrides: {
            onApplyOverride,
            onRemoveOverride,
            onRequestRecalc,
            pendingSimulationSync,
            isRecalculating,
            recalcErrorMessage,
          },
          comparison:
            isComparing && comparisonBaseline
              ? {
                  baseline: buildSimulationRecord(comparisonBaseline, services, expenses, companyRegime, {
                    logo_url: brandingLogoUrl,
                    org_name: brandingOrgName,
                  }),
                  onAdjustParams: handleRequestSingleView,
                  onCancel: clearComparison,
                  onUseCurrentAsBaseline: () => replaceBaselineWith(formResults),
                }
              : undefined,
          slots: {
            headerBanners: <PrivacyTrustBanner className="w-full board-ready:hidden" />,
            dossierCta: (
              <BoardReadyPresentationCta
                unlocked={boardReadyUnlocked}
                busy={dossierBusy}
                onDossier={handleOpenDossier}
                onFreeTease={() => setBoardTeaseOpen(true)}
                disabled={loading}
                className="shrink-0 board-ready:hidden no-print print:hidden"
              />
            ),
            sessionStampAside: formResults.meta?.reopenedFromHistory && (
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
            ),
          },
          sessionCompanyLabel,
          sessionScenarioLabel,
        })}
      </div>
    </motion.div>
  )
}
