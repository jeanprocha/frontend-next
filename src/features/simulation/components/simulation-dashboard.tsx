"use client"

// Movido de src/app/dashboard/page.tsx (FE-1, move puro) — container do
// simulador: estado de UI local, efeitos (board-ready, hidratação de
// comparação A/B, command bridge) e composição das 3 fases do pipeline
// (input | loading | results). A árvore de resultados form e a vista CSV
// vivem em dashboard-results-view.tsx / dashboard-csv-view.tsx.
import { useEffect, useState, useCallback, useMemo, type CSSProperties, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-client"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Monitor } from "lucide-react"
import { BOARD_READY_SESSION_KEY } from "@/hooks/use-board-ready"
import { SimulationForm } from "./simulation-form"
import {
  PipelineStageAnnouncer,
  PipelineStageCompass,
} from "./pipeline-stage-indicators"
import {
  UploadZone,
  type UploadResult,
  type UploadZonePipelinePhase,
} from "./upload-zone"
import { Skeleton } from "@/components/ui/skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import { errorDetailsFromUnknown } from "@/lib/api"
import { RequestIdSupportRow } from "@/components/ui/request-id-support"
import { useComparison } from "../hooks/use-comparison"
import { useBoardReady } from "@/hooks/use-board-ready"
import {
  usePipelineStage,
  PIPELINE_GLOW_POSITION,
} from "../hooks/use-pipeline-stage"
import { BoardReadyTeaseSheet } from "./board-ready-tease-sheet"
import { PrintButton } from "./print-button"
import {
  CONTAINER_VARIANTS,
  FADE_IN_VARIANTS,
} from "../lib/motion-variants"
import {
  clearDashboardCommandBridge,
  setDashboardCommandBridge,
} from "@/lib/dashboard-command-bridge"
import {
  PlgUpgradeDialog,
  usePlgCapabilities,
  useTribiaBranding,
} from "@/features/plg"
import {
  detailServicesToFormServices,
  parseCompanyRegimeFromDetail,
  simulationDetailToPersisted,
} from "@/lib/history-hydrate"
import { ShellBreadcrumb } from "@/components/shell/shell-breadcrumb"
import { SHELL_INNER_CLASS } from "@/lib/shell-layout"
import { useSimulationPipeline } from "../machine/use-simulation-pipeline"
import { simulationMachine } from "../machine/machine-store"
import { deriveSessionCompanyLabel } from "@/lib/session-labels"
import { DashboardResultsView } from "./dashboard-results-view"
import { DashboardCsvView } from "./dashboard-csv-view"
import type {
  ClassificationItem,
  FormExpense,
  FormService,
} from "@/types/api"
import type { ReportRenderInput } from "@/lib/report-contract"

// Resultado de CSV não persiste — depende de arquivo local efêmero.
interface CsvResults {
  mode: "csv"
  expenses: FormExpense[]
  classifications: ClassificationItem[]
}

type InputMode = "form" | "csv"

export interface SimulationDashboardProps {
  /** Renderer do dossié (features/report) — injectado por app/dashboard/page.tsx para não criar aresta simulation→report. */
  renderDossier: (input: Omit<ReportRenderInput, "sections">) => ReactNode
}

export function SimulationDashboard({ renderDossier }: SimulationDashboardProps) {
  const { userId: clerkUserId } = useAuth()
  const { isBoardReady, setIsBoardReady, toggleBoardReady } = useBoardReady()
  const plgCap = usePlgCapabilities()
  const [focusYear, setFocusYear] = useState(2026)
  const { brandingLogoUrl, brandingOrgName } = useTribiaBranding()
  const boardReadyUnlocked = plgCap.boardReadyUnlocked
  const [boardTeaseOpen, setBoardTeaseOpen] = useState(false)
  /** Cross-fade ao alternar Board-Ready: sinaliza opacity-0 no contentor de resultados. */
  const [boardFading, setBoardFading] = useState(false)
  const [compareUpgradeOpen, setCompareUpgradeOpen] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>("form")
  const [csvUploadPhase, setCsvUploadPhase] =
    useState<UploadZonePipelinePhase>("idle")

  // Resultado de CSV: estado local efêmero
  const [csvResults, setCsvResults] = useState<CsvResults | null>(null)

  // Estado de formulário (year/context/regime/serviços/despesas): continua no
  // Zustand — sem persistência, vive só enquanto a aba está aberta.
  const {
    companyRegime,
    companyContext,
    imobiliarioRedutorAjusteBrl,
    services,
    expenses,
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

  // Máquina de estados do pipeline (FE-1): classificar → calcular → salvar →
  // (override → recalcular) → dossiê. Ver features/simulation/machine/.
  const pipeline = useSimulationPipeline()
  const formResults = pipeline.results
  const loading = pipeline.isRunning
  const { pendingSync: pendingSimulationSync, isRecalculating, dossierBusy } = pipeline
  const { pendingHistoryComparison } = pipeline

  const failureDetail = useMemo(
    () => (pipeline.failure ? errorDetailsFromUnknown(pipeline.failure.error) : null),
    [pipeline.failure],
  )
  const error = failureDetail?.message ?? null
  const mutationRequestId = failureDetail?.requestId

  // Vista unificada: CSV tem prioridade enquanto ativo, senão mostra form
  const results: typeof formResults | CsvResults | null =
    csvResults ?? formResults ?? null

  // ── Labels do carimbo de autoridade (item 1.2.1) ─────────────────────────
  // Strings primitivas memoizadas: React.memo no carimbo não re-renderiza durante scroll.
  const sessionCompanyLabel = useMemo(() => {
    if (results?.mode !== "form") return ""
    return deriveSessionCompanyLabel(formResults?.meta?.companyContext ?? companyContext)
  }, [results?.mode, formResults?.meta?.companyContext, companyContext])

  const sessionScenarioLabel = useMemo(() => {
    if (results?.mode !== "form") return ""
    const year = formResults?.meta?.year ?? (results.simulation.year)
    if (isComparing) return `Comparação A/B — cenário actual · ${year}`
    return `Simulação base · ${year}`
  }, [results?.mode, results, formResults?.meta?.year, isComparing])

  useEffect(() => {
    if (results?.mode === "form") {
      setFocusYear(results.simulation.year)
    }
  }, [
    results?.mode,
    results && results.mode === "form" ? results.simulation.year : undefined,
  ])

  // ── Fluxo Formulário ─────────────────────────────────────────────────────
  function handleFormSubmit(
    year: number,
    services: FormService[],
    expenses: FormExpense[],
    companyContext: string,
  ) {
    setCsvResults(null)
    pipeline.actions.runSimulation({
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
    pipeline.actions.reset()
  }

  function handleCsvError(msg: string) {
    // Exibe o erro diretamente no JSX via estado local para o CSV
    setCsvResults(null)
    // Reutiliza o estado de erro da máquina para exibição uniforme
    pipeline.actions.reset()
    // Erro de CSV é tratado abaixo via csvError state
    setCsvError(msg)
  }

  const [csvError, setCsvError] = useState<string | null>(null)

  // ── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    setIsBoardReady(false)
    setBoardFading(false)
    setCsvResults(null)
    setCsvError(null)
    clearComparison()
    pipeline.actions.reset()
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

  // ── Hidratação Board-Ready a partir de sessionStorage (só no cliente) ─────
  // Executada uma única vez após montagem — valor inicial do store é sempre `false`
  // (SSR-safe). Activa o modo só se o utilizador tiver resultados + tier desbloqueado.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(BOARD_READY_SESSION_KEY)
      if (saved === "1" && plgCap.boardReadyUnlocked && results?.mode === "form") {
        setIsBoardReady(true)
      }
    } catch {
      // sessionStorage bloqueado (modo privado / sandbox)
    }
    // Intencionalmente sem dependências: executa só no mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Guardas: desactivar Board-Ready quando condições mudam ────────────────
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
      pipeline.actions.consumeHistoryComparison()
      setCompareUpgradeOpen(true)
      return
    }
    const { baseline: bDetail, current: cDetail } = pendingHistoryComparison
    pipeline.actions.consumeHistoryComparison()
    setCsvResults(null)

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
    simulationMachine.hydrateResults(persistedB)
  }, [
    plgCap.compareAB,
    pendingHistoryComparison,
    pipeline.actions,
    startComparison,
    setStoreYear,
    setStoreCompanyContext,
    setStoreCompanyRegime,
    setStoreServices,
    setStoreExpenses,
  ])

  const shouldReduceMotion = useReducedMotion() ?? false

  const handleRequestSingleView = useCallback(() => {
    clearComparison()
  }, [clearComparison])

  const isProOrPremium = plgCap.compareAB

  /** Atalhos PRO (bridge): alternar A/B sem depender do botão do veredito. */
  const toggleComparisonABFromBridge = useCallback(() => {
    if (!isProOrPremium) return
    if (!plgCap.compareAB) {
      setCompareUpgradeOpen(true)
      return
    }
    if (isComparing) {
      clearComparison()
      return
    }
    if (formResults?.mode === "form") {
      startComparison(formResults)
    }
  }, [
    isProOrPremium,
    plgCap.compareAB,
    isComparing,
    formResults,
    clearComparison,
    startComparison,
  ])

  const confirmAiDiagnosticFromBridge = useCallback(() => {
    if (!isProOrPremium) return
    pipeline.actions.clearAllOverrides()
  }, [isProOrPremium, pipeline.actions])

  const handlePresentationMode = useCallback(() => {
    if (boardReadyUnlocked) {
      if (!shouldReduceMotion && results) {
        // Cross-fade: fade-out → aplica novo modo → fade-in.
        // font-family não é interpolável — a troca Geist↔Serif acontece discretamente;
        // o fade em opacidade mascara o "pulo" visual sem jank.
        setBoardFading(true)
        window.setTimeout(() => {
          toggleBoardReady()
        }, 200)
        window.setTimeout(() => {
          setBoardFading(false)
        }, 400)
      } else {
        toggleBoardReady()
      }
    } else {
      setBoardTeaseOpen(true)
    }
  }, [boardReadyUnlocked, toggleBoardReady, shouldReduceMotion, results])

  const handleOpenDossier = useCallback(async () => {
    if (!formResults || !clerkUserId) return
    await pipeline.actions.openDossier({
      reportBrand: plgCap.whiteLabelExport
        ? { logo_url: brandingLogoUrl, org_name: brandingOrgName }
        : null,
    })
  }, [formResults, clerkUserId, pipeline.actions, plgCap.whiteLabelExport, brandingLogoUrl, brandingOrgName])

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
    pipeline.actions.runSimulation({
      year,
      services: validServices,
      expenses: validExpenses,
      companyContext,
      companyRegime: regime,
      imobiliarioRedutorAjusteBrl: redutor,
    })
  }, [pipeline.actions])

  useEffect(() => {
    const isFormInput = phase === "input" && inputMode === "form"
    const canBoard = results?.mode === "form" && !loading
    const proFormResults =
      isProOrPremium && results?.mode === "form" && !loading
    setDashboardCommandBridge({
      runSimulation: isFormInput && !loading ? runSimulationFromBridge : null,
      toggleBoardReady: canBoard ? handlePresentationMode : null,
      isSimulationInputPhase: isFormInput,
      hasFormResults: results?.mode === "form",
      isLoadingSimulation: loading,
      focusHistorySearch: null,
      openCompaniesNewForm: null,
      toggleComparisonAB: proFormResults ? toggleComparisonABFromBridge : null,
      confirmAiDiagnostic: proFormResults ? confirmAiDiagnosticFromBridge : null,
      isComparingAB: Boolean(isComparing),
    })
    return () => clearDashboardCommandBridge()
  }, [
    phase,
    inputMode,
    loading,
    results,
    runSimulationFromBridge,
    handlePresentationMode,
    isProOrPremium,
    isComparing,
    toggleComparisonABFromBridge,
    confirmAiDiagnosticFromBridge,
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
      <div
        className={cn(
          SHELL_INNER_CLASS,
          "py-8 space-y-6",
          boardReadyActive && "board-ready:max-w-5xl",
        )}
      >
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
              {/* Saída de emergência: só visível em Board-Ready (a sticky está oculta).
                  O CTA principal vive agora no toolbar / cabeçalho da página. */}
              {results.mode === "form" && boardReadyActive && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePresentationMode}
                  className="no-print print:hidden gap-1.5 border-border/60 hover:border-emerald-500/40"
                >
                  <Monitor className="h-4 w-4 shrink-0" aria-hidden />
                  Modo edição
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
            {mutationRequestId && !csvError ? (
              <RequestIdSupportRow requestId={mutationRequestId} />
            ) : null}
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
                <div id="tribia-sim-input" className="scroll-mt-24 space-y-4">
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
              className={cn(
                "flex flex-col gap-6",
                // Cross-fade Board-Ready: opacity-0 durante transição de modo.
                // font-family não é interpolável — o fade mascara o "pulo" Geist↔Serif.
                boardFading && "opacity-0",
                !shouldReduceMotion && "motion-safe:transition-opacity motion-safe:duration-[280ms]",
              )}
            >
              {results.mode === "form" && formResults && (
                <DashboardResultsView
                  formResults={formResults}
                  isComparing={isComparing}
                  comparisonBaseline={comparisonBaseline}
                  clearComparison={clearComparison}
                  replaceBaselineWith={replaceBaselineWith}
                  handleRequestSingleView={handleRequestSingleView}
                  services={services}
                  expenses={expenses}
                  focusYear={focusYear}
                  setFocusYear={setFocusYear}
                  boardReadyActive={boardReadyActive}
                  boardReadyUnlocked={boardReadyUnlocked}
                  sessionCompanyLabel={sessionCompanyLabel}
                  sessionScenarioLabel={sessionScenarioLabel}
                  dossierBusy={dossierBusy}
                  loading={loading}
                  handleOpenDossier={handleOpenDossier}
                  setBoardTeaseOpen={setBoardTeaseOpen}
                  pendingSimulationSync={pendingSimulationSync}
                  isRecalculating={isRecalculating}
                  onApplyOverride={pipeline.actions.applyOverride}
                  onRemoveOverride={pipeline.actions.removeOverride}
                  onRequestRecalc={pipeline.actions.requestRecalc}
                  shouldReduceMotion={shouldReduceMotion}
                  renderDossier={renderDossier}
                />
              )}

              {results.mode === "csv" && (
                <DashboardCsvView
                  expenses={results.expenses}
                  classifications={results.classifications}
                  boardReadyActive={boardReadyActive}
                  showCreditsRagLegend={showCreditsRagLegend}
                  shouldReduceMotion={shouldReduceMotion}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
