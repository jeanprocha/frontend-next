"use client"

import { useEffect, useState, useCallback, useRef, useMemo, type CSSProperties } from "react"
import { useAuth } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { History, Monitor } from "lucide-react"
import { BOARD_READY_SESSION_KEY } from "@/hooks/use-board-ready"
import { SimulationForm } from "@/components/tax/simulation-form"
import { AnalystBriefingSheet } from "@/components/tax/analyst-briefing-sheet"
import { TransitionPrintTable } from "@/components/tax/transition-print-table"
import { SimulationEsteiraSection } from "@/components/tax/simulation-esteira-section"
import { SimulationRecalcBridge } from "@/components/tax/simulation-recalc-bridge"
import { PrivacyTrustBanner } from "@/components/tax/privacy-trust-banner"
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
import { useSimulationRecalc } from "@/hooks/use-simulation-recalc"
import { errorDetailsFromUnknown, saveSimulationRecord } from "@/lib/api"
import { buildSimulationRecordCreatePayload } from "@/lib/build-simulation-record-payload"
import { RequestIdSupportRow } from "@/components/ui/request-id-support"
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
import { BoardReadyPresentationCta } from "@/components/tax/board-ready-presentation-cta"
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
import { simulationAtFocusYear } from "@/lib/transition-focus"
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

// ─── Helpers de derivação de labels (carimbo de sessão) ──────────────────────

/**
 * Extrai um «nome» legível do company_context.
 * Hierarquia:
 *  1. Texto antes do primeiro separador longo (— | - | :) se isso reduzir ruído.
 *  2. Primeira linha do contexto.
 *  3. Fallback institucional.
 * Puro, sem efeitos colaterais — seguro para useMemo.
 */
function deriveSessionCompanyLabel(context: string | null | undefined): string {
  const trimmed = (context ?? "").trim()
  if (!trimmed) return "Contexto não definido"
  const firstLine = trimmed.split(/\r?\n/)[0] ?? ""
  // Heurística: extrair antes de — ou - ou : quando o resultado for mais curto e limpo.
  const match = firstLine.match(/^([^—\-:]{4,60})(?:\s*[—\-:])/)
  const candidate = match?.[1]?.trim()
  if (candidate && candidate.length < firstLine.length) return candidate
  return firstLine
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isSignedIn, isLoaded: authLoaded, getToken, userId: clerkUserId } = useAuth()
  const queryClient = useQueryClient()
  const { isBoardReady, setIsBoardReady, toggleBoardReady } = useBoardReady()
  const plgTier = useTribiaPlgTier()
  const plgCap = usePlgCapabilities()
  const [focusYear, setFocusYear] = useState(2026)
  const { brandingLogoUrl, brandingOrgName } = useTribiaBranding()
  const boardReadyUnlocked = plgCap.boardReadyUnlocked
  const [boardTeaseOpen, setBoardTeaseOpen] = useState(false)
  /** Cross-fade ao alternar Board-Ready: sinaliza opacity-0 no contentor de resultados. */
  const [boardFading, setBoardFading] = useState(false)
  const [compareUpgradeOpen, setCompareUpgradeOpen] = useState(false)
  const [dossierBusy, setDossierBusy] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>("form")
  const [csvUploadPhase, setCsvUploadPhase] =
    useState<UploadZonePipelinePhase>("idle")

  // Resultado de CSV: estado local efêmero
  const [csvResults, setCsvResults] = useState<CsvResults | null>(null)

  // Resultado de formulário: lido do Zustand (persistido no localStorage)
  const {
    results: formResults,
    setResults: setFormResults,
    clearAllExpenseClassificationOverrides,
    companyRegime,
    companyContext,
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

  // ── 3.4.1 Override manual ────────────────────────────────────────────────
  const {
    recalculate: recalcImpact,
    recalculateAndWait,
    isRecalculating,
  } = useSimulationRecalc()
  const {
    pendingSimulationSync,
    applyExpenseClassificationOverride,
    removeExpenseClassificationOverride,
  } = useTaxStore()
  const mutationErrDetail = useMemo(
    () => errorDetailsFromUnknown(mutation.error),
    [mutation.error],
  )
  const error =
    mutation.error != null ? mutationErrDetail.message : null
  const mutationRequestId =
    mutation.error != null ? mutationErrDetail.requestId : undefined

  // Vista unificada: CSV tem prioridade enquanto ativo, senão mostra form
  const results: PersistedResults | CsvResults | null =
    csvResults ?? formResults ?? null

  const cardSimulation = useMemo(() => {
    if (results?.mode !== "form") return null
    if (!plgCap.transitionFocusYear) return results.simulation
    return simulationAtFocusYear(results.simulation, focusYear)
  }, [results, focusYear, plgCap.transitionFocusYear])

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
    setBoardFading(false)
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

  const shouldReduceMotion = useReducedMotion() ?? false

  const handleRequestSingleView = useCallback(() => {
    clearComparison()
  }, [clearComparison])

  const handleRequestComparisonView = useCallback(() => {
    if (isComparing) return
    if (!plgCap.compareAB) {
      setCompareUpgradeOpen(true)
      return
    }
    if (formResults?.mode === "form") {
      startComparison(formResults)
    }
  }, [isComparing, plgCap.compareAB, formResults, startComparison])

  const isProOrPremium = plgTier === "pro" || plgTier === "premium"

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
    clearAllExpenseClassificationOverrides()
  }, [isProOrPremium, clearAllExpenseClassificationOverrides])

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
    if (!formResults || formResults.mode !== "form" || !clerkUserId) return
    setDossierBusy(true)
    try {
      const token = await getToken()
      if (!token) return
      if (pendingSimulationSync) {
        await recalculateAndWait()
      }
      const state = useTaxStore.getState()
      const fr = state.results
      if (!fr || fr.mode !== "form") return
      let recordId = fr.meta?.recordId
      if (!recordId) {
        const payload = buildSimulationRecordCreatePayload(
          {
            year: fr.meta?.year ?? fr.simulation.year,
            companyContext: (fr.meta?.companyContext ?? companyContext).trim() || companyContext,
            companyRegime,
            services: state.services,
            expenses: state.expenses,
            formResults: fr,
          },
          {
            useInitialExpenseEligibility: false,
            reportBrand: plgCap.whiteLabelExport
              ? { logo_url: brandingLogoUrl, org_name: brandingOrgName }
              : null,
          },
        )
        const created = await saveSimulationRecord(token, clerkUserId, payload)
        recordId = created.id
        const meta = fr.meta
          ? { ...fr.meta, recordId: created.id }
          : {
              createdAt: new Date().toISOString(),
              companyContext,
              year: fr.simulation.year,
              recordId: created.id,
            }
        useTaxStore.getState().setResults({ ...fr, meta })
        await queryClient.invalidateQueries({ queryKey: ["simulation-records", clerkUserId] })
        await queryClient.invalidateQueries({ queryKey: ["plg-quota", clerkUserId] })
      }
      if (recordId) {
        window.open(`/report/${recordId}`, "_blank", "noopener,noreferrer")
      }
    } catch (e) {
      console.error("[TribIA] Dossié digital:", e)
    } finally {
      setDossierBusy(false)
    }
  }, [
    formResults,
    clerkUserId,
    getToken,
    pendingSimulationSync,
    recalculateAndWait,
    companyContext,
    companyRegime,
    plgCap.whiteLabelExport,
    brandingLogoUrl,
    brandingOrgName,
    queryClient,
  ])

  const phase = loading ? "loading" : results ? "results" : "input"

  const showCreditsRagLegend =
    results?.mode === "form" && Boolean(results.ai_metadata)

  /** Tabela de créditos na página só em modo CSV (em form a tabela fica na esteira). */
  const creditsTableInPage = results?.mode === "csv"

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
              simulationContextLine={sessionCompanyLabel || undefined}
              scenarioLine={sessionScenarioLabel || undefined}
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
            <TransitionPrintTable simulation={results.simulation} />
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
              {results.mode === "form" && (
                <motion.div
                  variants={FADE_IN_VARIANTS}
                  initial={shouldReduceMotion ? "visible" : "hidden"}
                  animate="visible"
                  className="flex flex-col gap-6 order-1 board-ready:order-2"
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
                  {formResults && (
                    <>
                      {/*
                       * 3.4.2 — Bridge reactiva store → motor Go.
                       * Observa overrideRecalcTick e dispara recalculateDebounced()
                       * (800ms) em modo automático — sem output visual (returns null).
                       * Auto-recalc suspenso em Board-Ready; CTA «Sincronizar Parecer»
                       * assume o controlo no toolbar slot (system.md modo apresentação).
                       */}
                      <SimulationRecalcBridge />

                      <div className="order-3 print:order-last board-ready:order-2">
                      <SimulationEsteiraSection
                        sessionStampAsideSlot={
                          formResults?.meta && (
                            <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 board-ready:hidden print:hidden w-full sm:max-w-none">
                              <div className="flex items-start justify-end gap-2.5 min-w-0 text-right sm:max-w-[24rem] sm:ml-auto">
                                <History className="h-4 w-4 shrink-0 text-accent mt-0.5" aria-hidden />
                                <div className="min-w-0 text-left sm:text-right">
                                  <p className="text-xs font-semibold text-accent">
                                    Simulação do histórico
                                  </p>
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
                        headerBannersSlot={
                          <PrivacyTrustBanner
                            plgTier={plgTier}
                            className="w-full board-ready:hidden"
                          />
                        }
                        showSessionOneHero={
                          Boolean(authLoaded && isSignedIn && !isComparing)
                        }
                        showExecutiveVerdict={!isComparing}
                        insightResult={cardSimulation ?? formResults.simulation}
                        insightSimulationRunYear={
                          results.mode === "form"
                            ? (results.meta?.year ?? results.simulation.year)
                            : undefined
                        }
                        insightOmitWhenVereditoCovers={
                          authLoaded && isSignedIn && !isComparing && Boolean(formResults)
                        }
                        summaryResult={cardSimulation ?? formResults.simulation}
                        summaryCompareBaseline={
                          isComparing && comparisonBaseline
                            ? comparisonBaseline.simulation
                            : undefined
                        }
                        summaryOverlapAnatomy={plgCap.transitionFocusYear}
                        summarySimulationRunYear={
                          results.mode === "form"
                            ? (results.meta?.year ?? results.simulation.year)
                            : undefined
                        }
                        summaryHideDeltaCard={!isComparing}
                        simulation={cardSimulation ?? formResults.simulation}
                        aiMetadata={formResults.ai_metadata}
                        classifications={formResults.classifications}
                        services={services}
                        expenses={expenses}
                        companyContext={
                          formResults.meta?.companyContext ?? companyContext ?? ""
                        }
                        focusYear={focusYear}
                        seriesEnriched={
                          formResults.simulation.transition_series_enriched === true
                        }
                        showTransitionAuditFactors={plgCap.transitionAuditFactors}
                        presentationMode={boardReadyActive}
                        sessionCompanyLabel={sessionCompanyLabel}
                        resultMeta={formResults?.meta}
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
                        onApplyOverride={applyExpenseClassificationOverride}
                        onRemoveOverride={removeExpenseClassificationOverride}
                        onRequestRecalc={recalcImpact}
                        transitionUi={{
                          chartResult: formResults.simulation,
                          abBaselineResult:
                            isComparing && comparisonBaseline
                              ? comparisonBaseline.simulation
                              : undefined,
                          transitionFocusYear: plgCap.transitionFocusYear,
                          transitionFullChart: plgCap.transitionFullChart,
                          transitionAuditFactors: plgCap.transitionAuditFactors,
                          transitionDynamicInsights: plgCap.transitionDynamicInsights,
                          onFocusYearChange: setFocusYear,
                        }}
                      />
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {results.mode === "csv" && (
                <motion.div
                  variants={FADE_IN_VARIANTS}
                  initial={shouldReduceMotion ? "visible" : "hidden"}
                  animate="visible"
                  className="order-5"
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

              {creditsTableInPage && (
                <motion.div
                  variants={FADE_IN_VARIANTS}
                  initial={shouldReduceMotion ? "visible" : "hidden"}
                  animate="visible"
                  id="tribia-journey-creditos"
                  className="order-4 scroll-mt-24 overflow-hidden rounded-xl border bg-white shadow-sm board-ready:shadow-none print:shadow-none"
                >
                  <div className="border-b bg-muted/30 px-5 py-4 board-ready:bg-transparent print:bg-transparent">
                    <h2
                      className={cn(
                        "text-sm font-semibold",
                        boardReadyActive && "font-board-report text-base",
                      )}
                    >
                      <span className="board-ready:hidden print:hidden">Análise de Créditos — IA</span>
                      <span className="hidden board-ready:inline print:inline">
                        Fundamentação de créditos — LC 68/2024
                      </span>
                    </h2>
                    {showCreditsRagLegend && (
                      <p
                        id="tribia-credits-rag-legend"
                        className="mt-1 text-xs leading-relaxed text-muted-foreground"
                      >
                        O índice de auditoria acima sintetiza a conformidade global; cada linha abaixo mostra a
                        fundamentação na LC 68/2024.
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground board-ready:hidden">
                      Borda à esquerda: verde elegível, âmbar atenção (inelegível ou vazamento de crédito), ardósia
                      neutro. &quot;Ver lei&quot; abre a Cédula de auditoria (diagnóstico, evidências e dispositivo
                      legal LC 68/2024).
                    </p>
                  </div>
                  <ExpenseTable
                    expenses={results.expenses}
                    classifications={results.classifications}
                    creditLeaks={undefined}
                    presentationMode={boardReadyActive}
                    ariaDescribedBy={showCreditsRagLegend ? "tribia-credits-rag-legend" : undefined}
                  />
                </motion.div>
              )}

              {results.mode === "form" && (
                <div className="order-6">
                  <PrintReportFooter
                    plgTier={plgTier}
                    whiteLabel={plgCap.whiteLabelExport}
                    isComparing={isComparing}
                    lawVersion={FISCAL_LAW_CHANGELOG.version}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnalystBriefingSheet />
    </main>
  )
}
