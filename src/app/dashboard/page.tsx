"use client"

import { useEffect, useState, useCallback, useRef, type CSSProperties } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { History, Lock, Monitor, Presentation } from "lucide-react"
import { SimulationForm } from "@/components/tax/simulation-form"
import { AnalystBriefingSheet } from "@/components/tax/analyst-briefing-sheet"
import { SummaryCards } from "@/components/tax/summary-cards"
import { TribiaInsights } from "@/components/tax/tribia-insights"
import { TransitionChart } from "@/components/tax/transition-chart"
import { SankeyFlow } from "@/components/tax/sankey-flow"
import { CreditLeakageAlert } from "@/components/tax/credit-leakage-alert"
import { RagAuditCard } from "@/components/tax/rag-audit-card"
import { ExpenseTable } from "@/components/tax/expense-table"
import {
  PipelineStageAnnouncer,
  PipelineStageCompass,
} from "@/components/tax/pipeline-stage-indicators"
import {
  UploadZone,
  type UploadResult,
  type UploadZonePipelinePhase,
} from "@/components/tax/upload-zone"
import { CsvSummary } from "@/components/tax/csv-summary"
import { Skeleton } from "@/components/ui/skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTaxStore, type PersistedResults } from "@/store/useTaxStore"
import { useSimulationMutation } from "@/hooks/use-simulation"
import { useComparison } from "@/hooks/use-comparison"
import { useBoardReady } from "@/hooks/use-board-ready"
import {
  usePipelineStage,
  PIPELINE_GLOW_POSITION,
} from "@/hooks/use-pipeline-stage"
import { ScenarioComparisonBar } from "@/components/tax/scenario-comparison-bar"
import { ComparisonVerdictCard } from "@/components/tax/comparison-verdict-card"
import {
  accumulatedNewTaxDiff,
  projectedNetTaxDiff,
} from "@/lib/comparison-metrics"
import {
  BoardReadyHeader,
  BoardReadyWatermark,
} from "@/components/tax/board-ready-header"
import { BoardReadyTeaseSheet } from "@/components/tax/board-ready-tease-sheet"
import { PrintButton } from "@/components/tax/print-button"
import {
  PrintReportFooter,
  PrintReportHeader,
} from "@/components/tax/print-report-chrome"
import {
  CONTAINER_VARIANTS,
  FADE_IN_VARIANTS,
} from "@/lib/motion-variants"
import {
  clearDashboardCommandBridge,
  setDashboardCommandBridge,
} from "@/lib/dashboard-command-bridge"
import {
  usePlgCapabilities,
  useTribiaBranding,
  useTribiaPlgTier,
} from "@/hooks/use-tribia-plg-tier"
import { PlgUpgradeDialog } from "@/components/tribia/plg-upgrade-dialog"
import {
  detailServicesToFormServices,
  parseCompanyRegimeFromDetail,
  simulationDetailToPersisted,
} from "@/lib/history-hydrate"
import { ShellBreadcrumb } from "@/components/shell/shell-breadcrumb"
import { SHELL_INNER_CLASS } from "@/lib/shell-layout"
import { FISCAL_LAW_CHANGELOG } from "@/lib/fiscal-law-changelog"
import type {
  ClassificationItem,
  FormExpense,
  FormService,
} from "@/types/api"

// ─── Tipos ───────────────────────────────────────────────────────────────────

// Resultado de CSV não persiste — depende de arquivo local efêmero.
interface CsvResults {
  mode: "csv"
  expenses: FormExpense[]
  classifications: ClassificationItem[]
}

type InputMode = "form" | "csv"

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isBoardReady, setIsBoardReady, toggleBoardReady } = useBoardReady()
  const plgTier = useTribiaPlgTier()
  const plgCap = usePlgCapabilities()
  const { brandingLogoUrl, brandingOrgName } = useTribiaBranding()
  const boardReadyUnlocked = plgCap.boardReadyUnlocked
  const [boardTeaseOpen, setBoardTeaseOpen] = useState(false)
  const [compareUpgradeOpen, setCompareUpgradeOpen] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>("form")
  const [csvUploadPhase, setCsvUploadPhase] =
    useState<UploadZonePipelinePhase>("idle")

  // Resultado de CSV: estado local efêmero
  const [csvResults, setCsvResults] = useState<CsvResults | null>(null)

  // Resultado de formulário: lido do Zustand (persistido no localStorage)
  const {
    results: formResults,
    setResults: setFormResults,
    companyRegime,
    imobiliarioRedutorAjusteBrl,
    services,
    expenses,
    pendingHistoryComparison,
    setPendingHistoryComparison,
    setYear: setStoreYear,
    setCompanyContext: setStoreCompanyContext,
    setCompanyRegime: setStoreCompanyRegime,
    setServices: setStoreServices,
    setExpenses: setStoreExpenses,
  } = useTaxStore()

  const {
    baseline: comparisonBaseline,
    isComparing,
    startComparison,
    clearComparison,
    replaceBaselineWith,
  } = useComparison()

  // TanStack Query: substitui useState(loading) + useState(error) + try/catch
  const mutation = useSimulationMutation()
  const mutationResetRef = useRef(mutation.reset)
  mutationResetRef.current = mutation.reset
  const loading = mutation.isPending
  const error = mutation.error?.message ?? null

  // Vista unificada: CSV tem prioridade enquanto ativo, senão mostra form
  const results: PersistedResults | CsvResults | null =
    csvResults ?? formResults ?? null

  // ── Fluxo Formulário ─────────────────────────────────────────────────────
  // handleFormSubmit agora delega o trabalho pesado ao hook de mutação.
  // A lógica de classify → simulate → setFormResults vive em use-simulation.ts.
  function handleFormSubmit(
    year: number,
    services: FormService[],
    expenses: FormExpense[],
    companyContext: string,
  ) {
    setCsvResults(null)
    mutation.mutate({
      year,
      services,
      expenses,
      companyContext,
      companyRegime,
      imobiliarioRedutorAjusteBrl,
    })
  }

  // ── Fluxo CSV (inalterado) ───────────────────────────────────────────────
  function handleCsvResult(result: UploadResult) {
    setCsvResults({
      mode: "csv",
      expenses: result.expenses,
      classifications: result.classifications,
    })
    mutation.reset()
  }

  function handleCsvError(msg: string) {
    // Exibe o erro diretamente no JSX via estado local para o CSV
    setCsvResults(null)
    // Reutiliza o estado de erro do mutation para exibição uniforme
    mutation.reset()
    // Erro de CSV é tratado abaixo via csvError state
    setCsvError(msg)
  }

  const [csvError, setCsvError] = useState<string | null>(null)

  // ── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    setIsBoardReady(false)
    setCsvResults(null)
    setCsvError(null)
    setFormResults(null)
    clearComparison()
    mutation.reset()   // limpa isPending / error do TanStack
  }

  const displayError = error ?? csvError

  useEffect(() => {
    if (inputMode !== "csv") setCsvUploadPhase("idle")
  }, [inputMode])

  const csvProcessing =
    inputMode === "csv" &&
    (csvUploadPhase === "parsing" || csvUploadPhase === "classifying")

  const pipelineStage = usePipelineStage({
    loading,
    hasFormSimulationResults: results?.mode === "form",
    hasCsvClassificationResults: results?.mode === "csv",
    csvProcessing,
    inputMode,
    services,
    expenses,
  })
  const glowPos = PIPELINE_GLOW_POSITION[pipelineStage]
  const pipelineGlowStyle = {
    "--tribia-glow-x": glowPos.x,
    "--tribia-glow-y": glowPos.y,
  } as CSSProperties

  const boardReadyActive =
    isBoardReady && results?.mode === "form"

  useEffect(() => {
    if (!results || results.mode !== "form") {
      setIsBoardReady(false)
    }
  }, [results, setIsBoardReady])

  useEffect(() => {
    if (!boardReadyUnlocked && isBoardReady) {
      setIsBoardReady(false)
    }
  }, [boardReadyUnlocked, isBoardReady, setIsBoardReady])

  useEffect(() => {
    if (!pendingHistoryComparison) return
    if (!plgCap.compareAB) {
      setPendingHistoryComparison(null)
      setCompareUpgradeOpen(true)
      return
    }
    const { baseline: bDetail, current: cDetail } = pendingHistoryComparison
    setPendingHistoryComparison(null)
    setCsvResults(null)
    mutationResetRef.current()

    const metaA = {
      createdAt: bDetail.created_at,
      companyContext: bDetail.company_context ?? "",
      year: bDetail.year,
    }
    const metaB = {
      createdAt: cDetail.created_at,
      companyContext: cDetail.company_context ?? "",
      year: cDetail.year,
    }
    const persistedA = simulationDetailToPersisted(bDetail, metaA)
    const persistedB = simulationDetailToPersisted(cDetail, metaB)

    startComparison(persistedA)
    setStoreYear(cDetail.year)
    setStoreCompanyContext(cDetail.company_context ?? "")
    setStoreCompanyRegime(parseCompanyRegimeFromDetail(cDetail))
    setStoreServices(detailServicesToFormServices(cDetail.services))
    setStoreExpenses(persistedB.expenses)
    setFormResults(persistedB)
  }, [
    plgCap.compareAB,
    pendingHistoryComparison,
    setPendingHistoryComparison,
    startComparison,
    setStoreYear,
    setStoreCompanyContext,
    setStoreCompanyRegime,
    setStoreServices,
    setStoreExpenses,
    setFormResults,
  ])

  const handlePresentationMode = useCallback(() => {
    if (boardReadyUnlocked) {
      toggleBoardReady()
    } else {
      setBoardTeaseOpen(true)
    }
  }, [boardReadyUnlocked, toggleBoardReady])

  const shouldReduceMotion = useReducedMotion() ?? false
  const phase = loading ? "loading" : results ? "results" : "input"

  const showCreditsRagLegend =
    results?.mode === "form" && Boolean(results.ai_metadata)

  const runSimulationFromBridge = useCallback(() => {
    const {
      year,
      companyContext,
      services,
      expenses,
      companyRegime: regime,
      imobiliarioRedutorAjusteBrl: redutor,
    } = useTaxStore.getState()
    const validServices = services.filter((s) => s.description?.trim() && s.amount?.trim())
    const validExpenses = expenses.filter((e) => e.description?.trim() && e.amount?.trim())
    if (validServices.length === 0) return
    setCsvResults(null)
    mutation.mutate({
      year,
      services: validServices,
      expenses: validExpenses,
      companyContext,
      companyRegime: regime,
      imobiliarioRedutorAjusteBrl: redutor,
    })
  }, [mutation, setCsvResults])

  useEffect(() => {
    const isFormInput = phase === "input" && inputMode === "form"
    const canBoard = results?.mode === "form" && !loading
    setDashboardCommandBridge({
      runSimulation: isFormInput && !loading ? runSimulationFromBridge : null,
      toggleBoardReady: canBoard ? handlePresentationMode : null,
      isSimulationInputPhase: isFormInput,
      hasFormResults: results?.mode === "form",
      isLoadingSimulation: loading,
      focusHistorySearch: null,
      openCompaniesNewForm: null,
    })
    return () => clearDashboardCommandBridge()
  }, [
    phase,
    inputMode,
    loading,
    results,
    runSimulationFromBridge,
    handlePresentationMode,
  ])

  return (
    <main
      className={cn(
        "relative min-h-screen bg-tribia-canvas transition-colors duration-500",
        "board-ready:bg-white",
      )}
      data-pipeline-stage={pipelineStage}
      style={pipelineGlowStyle}
    >
      <BoardReadyTeaseSheet open={boardTeaseOpen} onOpenChange={setBoardTeaseOpen} />
      <PlgUpgradeDialog
        open={compareUpgradeOpen}
        onOpenChange={setCompareUpgradeOpen}
        feature="compare_ab"
      />
      <PipelineStageAnnouncer stage={pipelineStage} />
      <div
        className={cn(
          "pointer-events-none fixed inset-0 -z-10 dashboard-pipeline-glow",
          pipelineStage === "simulation" && "dashboard-pipeline-glow--pulse",
        )}
        aria-hidden
      />
      {results?.mode === "form" && (
        <BoardReadyWatermark
          visible={plgCap.freeWatermark}
          label={
            plgCap.freeWatermark
              ? "Gerado por TribIA Free"
              : "Gerado por TribIA"
          }
        />
      )}
      <div
        className={cn(
          SHELL_INNER_CLASS,
          "py-8 space-y-6",
          boardReadyActive && "board-ready:max-w-5xl",
        )}
      >
        {results?.mode === "form" && !loading && (
          <>
            <PrintReportHeader
              generatedAtIso={formResults?.meta?.createdAt}
              whiteLabel={plgCap.whiteLabelExport}
              clientBrandName={brandingOrgName}
              clientLogoUrl={brandingLogoUrl}
            />
            <BoardReadyHeader
              companyContext={
                formResults?.meta?.companyContext ?? undefined
              }
              year={results.simulation.year}
              createdAtIso={formResults?.meta?.createdAt ?? null}
              whiteLabel={plgCap.whiteLabelExport}
              clientBrandName={brandingOrgName}
              clientLogoUrl={brandingLogoUrl}
            />
          </>
        )}

        <div
          className={cn(
            "board-ready:hidden print:hidden",
            results?.mode === "form" && "no-print",
          )}
        >
          <ShellBreadcrumb items={[{ label: "Simulador" }]} />
        </div>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-end gap-3",
            boardReadyActive ? "sm:justify-end" : "sm:justify-between",
          )}
        >
          <div
            className={cn(
              "space-y-0.5",
              results?.mode === "form" && "board-ready:hidden",
            )}
          >
            <h1 className="text-2xl font-bold tracking-tight">Simulador de Reforma Tributária</h1>
            <p className="text-sm text-muted-foreground">
              Calcule o impacto da transição CBS/IBS com classificação de créditos por IA — LC 68/2024.
            </p>
            {!boardReadyActive && (
              <PipelineStageCompass stage={pipelineStage} className="pt-0.5" />
            )}
          </div>

          {/* Segmented control — só aparece quando não há resultado */}
          {!results && (
            <div className="inline-flex shrink-0 rounded-lg border bg-muted p-1 gap-0.5">
              {(["form", "csv"] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setInputMode(m); reset() }}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                    inputMode === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "form" ? "Simulação Manual" : "Upload de CSV"}
                </button>
              ))}
            </div>
          )}

          {/* Botões quando há resultado */}
          {results && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
              {results.mode === "form" && formResults?.meta && (
                <Link
                  href="/dashboard/history"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "board-ready:hidden no-print print:hidden",
                  )}
                >
                  Voltar ao histórico
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="board-ready:hidden no-print print:hidden"
              >
                ← {results.mode === "form" ? "Nova simulação" : "Novo arquivo"}
              </Button>
              {results.mode === "form" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handlePresentationMode}
                  className={cn(
                    "no-print print:hidden gap-1.5",
                    !boardReadyUnlocked && "tribia-touch-target min-h-11 sm:min-h-9",
                  )}
                  aria-pressed={boardReadyUnlocked ? isBoardReady : undefined}
                  aria-label={
                    boardReadyUnlocked
                      ? undefined
                      : "Modo apresentação — disponível no plano Pro"
                  }
                >
                  {boardReadyUnlocked && isBoardReady ? (
                    <>
                      <Monitor className="h-4 w-4" aria-hidden />
                      Modo edição
                    </>
                  ) : boardReadyUnlocked ? (
                    <>
                      <Presentation className="h-4 w-4" aria-hidden />
                      Modo apresentação
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" aria-hidden />
                      Modo apresentação
                    </>
                  )}
                </Button>
              )}
              {boardReadyActive && <PrintButton />}
              {results.mode === "form" &&
                formResults &&
                !isComparing &&
                !loading && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (!plgCap.compareAB) {
                        setCompareUpgradeOpen(true)
                        return
                      }
                      startComparison(formResults)
                    }}
                    className="no-print print:hidden gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    aria-label="Congelar esta simulação como referência (A) para comparar com uma nova (B)"
                  >
                    Comparar cenário
                  </Button>
                )}
            </div>
          )}
        </div>

        {/* ── Erro ───────────────────────────────────────────────────────── */}
        {displayError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <strong>Erro:</strong> {displayError}
          </div>
        )}

        {/* ── Banner: simulação carregada do histórico ─────────────────── */}
        {formResults?.meta && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 board-ready:hidden">
            <div className="flex items-start gap-2.5 min-w-0">
              <History className="h-4 w-4 shrink-0 text-accent mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-accent">Simulação do histórico</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
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
        )}

        {/* ── Máquina de estados: input | loading | results (Motion) ─────── */}
        <AnimatePresence mode="wait">
          {phase === "input" && (
            <motion.div
              key="input"
              variants={FADE_IN_VARIANTS}
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {inputMode === "form" && (
                <div className="space-y-4">
                  {isComparing && !formResults && !csvResults && (
                    <div
                      className="rounded-xl border border-emerald-500/30 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100"
                      role="status"
                    >
                      <p className="font-semibold">Comparação A/B ativa</p>
                      <p className="mt-1 text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                        Ajuste ano, regime ou dados e execute uma nova simulação para ver o cenário B ao lado da
                        referência congelada.
                      </p>
                    </div>
                  )}
                  <SimulationForm
                    onSubmit={handleFormSubmit}
                    loading={loading}
                  />
                </div>
              )}
              {inputMode === "csv" && (
                <UploadZone
                  companyContext="Empresa SaaS B2B, regime regular IBS/CBS"
                  onResult={handleCsvResult}
                  onError={handleCsvError}
                  onPhaseChange={setCsvUploadPhase}
                />
              )}
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-2.5 w-36" />
                  </div>
                ))}
              </div>
              <div className="rounded-xl border bg-white p-5 space-y-2.5">
                <Skeleton className="h-4 w-44" />
                <div className="rounded-lg border overflow-hidden">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-20 ml-auto" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {phase === "results" && results && (
            <motion.div
              key="results"
              variants={CONTAINER_VARIANTS}
              initial={shouldReduceMotion ? "visible" : "hidden"}
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {results.mode === "form" && (
                <motion.div
                  variants={FADE_IN_VARIANTS}
                  initial={shouldReduceMotion ? "visible" : "hidden"}
                  animate="visible"
                  className="flex flex-col gap-6"
                >
                  {isComparing && comparisonBaseline && (
                    <ScenarioComparisonBar
                      baseline={comparisonBaseline}
                      onAdjustParams={() => setFormResults(null)}
                      onCancel={clearComparison}
                      onUseCurrentAsBaseline={
                        formResults
                          ? () => replaceBaselineWith(formResults)
                          : undefined
                      }
                      className="board-ready:hidden no-print print:hidden"
                    />
                  )}
                  {(boardReadyActive || plgTier === "premium") &&
                    formResults &&
                    !isComparing && (
                      <div
                        className={cn(
                          "print:order-first",
                          boardReadyActive
                            ? "order-2 board-ready:order-first"
                            : "order-first",
                        )}
                      >
                        <ComparisonVerdictCard
                          mode="single"
                          plgTier={plgTier}
                          currentSimulation={formResults.simulation}
                          strategyInsight={formResults.simulation.strategy_insight}
                          ragSources={formResults.ai_metadata?.sources_analyzed ?? null}
                        />
                      </div>
                    )}
                  <div className="order-1 space-y-6 board-ready:order-2 print:order-2">
                    <div>
                      <h2
                        className={cn(
                          "text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide",
                          boardReadyActive &&
                            "font-board-report text-lg normal-case text-foreground",
                        )}
                      >
                        Comparativo Tributário — {results.simulation.year}
                      </h2>
                      <SummaryCards
                        result={results.simulation}
                        compareBaseline={
                          isComparing && comparisonBaseline
                            ? comparisonBaseline.simulation
                            : undefined
                        }
                      />
                      <div className="mt-4">
                        <RagAuditCard
                          aiMetadata={results.mode === "form" ? results.ai_metadata : undefined}
                        />
                      </div>
                      <div className="mt-4">
                        <TribiaInsights result={results.simulation} />
                      </div>
                    </div>
                  </div>
                  {isComparing && comparisonBaseline && formResults && (
                    <div className="order-2 board-ready:order-first print:order-first">
                      <ComparisonVerdictCard
                        mode="comparison"
                        plgTier={plgTier}
                        accumulatedDiff={accumulatedNewTaxDiff(
                          comparisonBaseline.simulation.transition_series,
                          formResults.simulation.transition_series,
                        )}
                        projectedNetDiff={projectedNetTaxDiff(
                          comparisonBaseline.simulation,
                          formResults.simulation,
                        )}
                        strategyInsight={formResults.simulation.strategy_insight}
                        baselineSimulation={comparisonBaseline.simulation}
                        currentSimulation={formResults.simulation}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {results.mode === "form" && (
                <motion.div
                  variants={FADE_IN_VARIANTS}
                  initial={shouldReduceMotion ? "visible" : "hidden"}
                  animate="visible"
                  className="grid min-h-[480px] grid-cols-1 gap-6 lg:grid-cols-2 board-ready:grid-cols-1 board-ready:gap-10"
                >
                  <TransitionChart
                    result={results.simulation}
                    abBaselineResult={
                      isComparing && comparisonBaseline
                        ? comparisonBaseline.simulation
                        : undefined
                    }
                  />
                  <div className="min-w-0 print:hidden">
                    <SankeyFlow
                      simulation={results.simulation}
                      expenses={results.expenses}
                      services={services}
                    />
                  </div>
                </motion.div>
              )}

              {results.mode === "form" && (
                <motion.div
                  variants={FADE_IN_VARIANTS}
                  initial={shouldReduceMotion ? "visible" : "hidden"}
                  animate="visible"
                  className="print:hidden"
                >
                  <CreditLeakageAlert result={results.simulation} />
                </motion.div>
              )}

              {results.mode === "csv" && (
                <motion.div
                  variants={FADE_IN_VARIANTS}
                  initial={shouldReduceMotion ? "visible" : "hidden"}
                  animate="visible"
                >
                  <h2
                    className={cn(
                      "text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide",
                      boardReadyActive &&
                        "font-board-report text-lg normal-case text-foreground",
                    )}
                  >
                    Resumo da Classificação — {results.expenses.length} despesas processadas
                  </h2>
                  <CsvSummary
                    expenses={results.expenses}
                    classifications={results.classifications}
                  />
                </motion.div>
              )}

              <motion.div
                variants={FADE_IN_VARIANTS}
                initial={shouldReduceMotion ? "visible" : "hidden"}
                animate="visible"
                className="rounded-xl border bg-white shadow-sm overflow-hidden board-ready:shadow-none print:shadow-none"
              >
                <div className="px-5 py-4 border-b bg-muted/30 board-ready:bg-transparent print:bg-transparent">
                  <h2
                    className={cn(
                      "text-sm font-semibold",
                      boardReadyActive && "font-board-report text-base",
                    )}
                  >
                    <span className="board-ready:hidden print:hidden">
                      Análise de Créditos — IA
                    </span>
                    <span className="hidden board-ready:inline print:inline">
                      Fundamentação de créditos — LC 68/2024
                    </span>
                  </h2>
                  {showCreditsRagLegend && (
                    <p
                      id="tribia-credits-rag-legend"
                      className="text-xs text-muted-foreground mt-1 leading-relaxed"
                    >
                      O índice de auditoria acima reflete a conformidade global; os detalhes por linha indicam a
                      fundamentação na LC 68/2024.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5 board-ready:hidden">
                    Borda à esquerda: verde elegível, âmbar atenção (inelegível ou vazamento de crédito), ardósia neutro.
                    Ícone IA abre resumo; descrição abre briefing; &quot;Ver lei&quot; mostra artigos LC 68/2024.
                  </p>
                </div>
                <ExpenseTable
                  expenses={results.expenses}
                  classifications={results.classifications}
                  creditLeaks={results.mode === "form" ? results.simulation.credit_leaks : undefined}
                  presentationMode={boardReadyActive}
                  ariaDescribedBy={showCreditsRagLegend ? "tribia-credits-rag-legend" : undefined}
                />
              </motion.div>

              {results.mode === "form" && (
                <PrintReportFooter
                  plgTier={plgTier}
                  whiteLabel={plgCap.whiteLabelExport}
                  isComparing={isComparing}
                  lawVersion={FISCAL_LAW_CHANGELOG.version}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnalystBriefingSheet />
    </main>
  )
}
