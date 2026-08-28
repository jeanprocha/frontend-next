"use client"

// Movido de src/app/dashboard/page.tsx (FE-1, move puro) — container do
// simulador: estado de UI local, efeitos (board-ready, hidratação de
// comparação A/B, command bridge) e composição das 3 fases do pipeline
// (input | loading | results). A árvore de resultados vive em
// dashboard-results-view.tsx; o painel de entrada (form + importers) vive em
// dashboard-input-panel.tsx (FE-3, PR 3c — o fork CSV classify-only que
// vivia aqui, com dashboard-csv-view.tsx/csv-summary.tsx, foi dissolvido:
// upload agora só preenche o formulário, ver features/import).
import { useEffect, useState, useCallback, useMemo, type CSSProperties, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-client"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Monitor } from "lucide-react"
import { BOARD_READY_SESSION_KEY } from "@/hooks/use-board-ready"
import {
  PipelineStageAnnouncer,
  PipelineStageCompass,
  PipelineStageProgress,
} from "./pipeline-stage-indicators"
import { DashboardInputPanel } from "./dashboard-input-panel"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import { errorDetailsFromUnknown } from "@/lib/api"
import { clampSimulationYear, validateSimulationLines } from "@/lib/simulation-line-helpers"
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
import { ROTAS } from "@/constants/routes"
import { DashboardResultsView } from "./dashboard-results-view"
import type { FormExpense, FormService } from "@/types/api"
import type { ImporterPanelEntry } from "@/lib/importer-contract"
import type { ReportRenderInput } from "@/lib/report-contract"
import type { ShellBreadcrumbItem } from "@/components/shell/shell-breadcrumb"

export interface SimulationDashboardProps {
  /** Renderer do dossié (features/report) — injectado por app/ para não criar aresta simulation→report. */
  renderDossier: (input: Omit<ReportRenderInput, "sections">) => ReactNode
  /** Entries do painel de entrada (features/import) — injectadas por app/ para não criar aresta simulation→import. */
  importerEntries: ImporterPanelEntry[]
  /** Cliente da carteira (FE-4) — presente no workspace /clientes/[companyId]; ausente no simulador avulso. */
  companyId?: string
  /** Nome real do cliente (FE-4) — sobrepõe a heurística deriveSessionCompanyLabel quando presente. */
  nomeDoCliente?: string
  /** Default: [{label: "Simulador"}] — o workspace do cliente injeta [Clientes → <nome>]. */
  breadcrumbItems?: ShellBreadcrumbItem[]
  /** Default: ROTAS.simulacoes (histórico global) — o workspace injeta ROTAS.cliente(companyId). */
  historyHref?: string
}

export function SimulationDashboard({
  renderDossier,
  importerEntries,
  companyId,
  nomeDoCliente,
  breadcrumbItems = [{ label: "Simulador" }],
  historyHref = ROTAS.simulacoes,
}: SimulationDashboardProps) {
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
  const { pendingHistoryComparison, lastRecalcError, lastPersistError } = pipeline
  const { retryPersist } = pipeline.actions

  const failureDetail = useMemo(
    () => (pipeline.failure ? errorDetailsFromUnknown(pipeline.failure.error) : null),
    [pipeline.failure],
  )
  const error = failureDetail?.message ?? null
  const mutationRequestId = failureDetail?.requestId

  // Etapa M/PR 8: falha ao salvar o registro (origem initial/recalc/dossier)
  // — antes ficava só em console.error, o veredito continuava na tela como
  // se tudo tivesse sido persistido. Suprimido enquanto dossierBusy: o
  // "Gerar Dossiê digital" já tem o próprio spinner, e reabrir a última
  // falha durante uma nova tentativa em voo confundiria mais do que ajudaria.
  const persistFailureDetail = useMemo(
    () => (lastPersistError && !dossierBusy ? errorDetailsFromUnknown(lastPersistError) : null),
    [lastPersistError, dossierBusy],
  )

  // Etapa M/PR 8: mensagem real por trás do banner "Classificações alteradas"
  // (mesa-rastreabilidade.tsx) — antes o banner só dizia que havia
  // pendência, sem dizer o que deu errado na última tentativa de recálculo.
  const recalcErrorMessage = useMemo(
    () => (lastRecalcError ? errorDetailsFromUnknown(lastRecalcError).message : null),
    [lastRecalcError],
  )

  // ── Labels do carimbo de autoridade (item 1.2.1) ─────────────────────────
  // Strings primitivas memoizadas: React.memo no carimbo não re-renderiza durante scroll.
  const sessionCompanyLabel = useMemo(() => {
    if (!formResults) return ""
    return nomeDoCliente ?? deriveSessionCompanyLabel(formResults.meta?.companyContext ?? companyContext)
  }, [formResults, companyContext, nomeDoCliente])

  const sessionScenarioLabel = useMemo(() => {
    if (!formResults) return ""
    const year = formResults.meta?.year ?? formResults.simulation.year
    if (isComparing) return `Comparação A/B — cenário atual · ${year}`
    return `Simulação base · ${year}`
  }, [formResults, isComparing])

  // Dep escalar (não o objeto inteiro) — evita resetar o ano focado a cada
  // mudança de referência de formResults sem mudança real de ano (override/recalc).
  const formYear = formResults?.simulation.year
  useEffect(() => {
    if (formResults) {
      setFocusYear(formResults.simulation.year)
    }
  }, [formYear]) // eslint-disable-line react-hooks/exhaustive-deps -- herança: reagir só à mudança de ano, não a toda mudança de referência

  // Etapa N/PR 9 (fato 12) — capturada aqui, no momento de simular: o persist
  // "initial" roda automaticamente assim que os resultados ficam prontos,
  // tipicamente antes do usuário sequer olhar o botão "Gerar Dossiê" — se a
  // marca só fosse lida em handleOpenDossier, o registro já persistido sem
  // ela nunca mais poderia ser corrigido (não há endpoint de atualização).
  // Memoizado: entra como dependência de runSimulationFromBridge (useCallback)
  // e do bridge de comandos abaixo — um objeto novo a cada render forçaria os
  // dois a recriar/reregistrar sem necessidade.
  const reportBrandForRun = useMemo(
    () => (plgCap.whiteLabelExport ? { logo_url: brandingLogoUrl, org_name: brandingOrgName } : null),
    [plgCap.whiteLabelExport, brandingLogoUrl, brandingOrgName],
  )

  // ── Fluxo Formulário ─────────────────────────────────────────────────────
  function handleFormSubmit(
    year: number,
    services: FormService[],
    expenses: FormExpense[],
    companyContext: string,
  ) {
    pipeline.actions.runSimulation({
      year,
      services,
      expenses,
      companyContext,
      companyRegime,
      imobiliarioRedutorAjusteBrl,
      companyId,
      reportBrand: reportBrandForRun,
    })
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    setIsBoardReady(false)
    setBoardFading(false)
    clearComparison()
    pipeline.actions.reset()
  }

  const machineStatus = formResults ? "ready" : loading ? "running" : "idle"
  const pipelineStage = usePipelineStage({
    machineStatus,
    runningUiStage: pipeline.runningUiStage,
    services,
    expenses,
  })
  const glowPos = PIPELINE_GLOW_POSITION[pipelineStage]
  const pipelineGlowStyle = {
    "--tribia-glow-x": glowPos.x,
    "--tribia-glow-y": glowPos.y,
  } as CSSProperties

  const boardReadyActive = isBoardReady && Boolean(formResults)

  // ── Hidratação Board-Ready a partir de sessionStorage (só no cliente) ─────
  // Executada uma única vez após montagem — valor inicial do store é sempre `false`
  // (SSR-safe). Activa o modo só se o utilizador tiver resultados + tier desbloqueado.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(BOARD_READY_SESSION_KEY)
      if (saved === "1" && plgCap.boardReadyUnlocked && formResults) {
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
    if (!formResults) {
      setIsBoardReady(false)
    }
  }, [formResults, setIsBoardReady])

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

    const metaA = {
      createdAt: bDetail.created_at,
      companyContext: bDetail.company_context ?? "",
      year: bDetail.year,
      reopenedFromHistory: true,
    }
    const metaB = {
      createdAt: cDetail.created_at,
      companyContext: cDetail.company_context ?? "",
      year: cDetail.year,
      reopenedFromHistory: true,
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
    if (formResults) {
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
      if (!shouldReduceMotion && formResults) {
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
  }, [boardReadyUnlocked, toggleBoardReady, shouldReduceMotion, formResults])

  const handleOpenDossier = useCallback(async () => {
    if (!formResults || !clerkUserId) return
    await pipeline.actions.openDossier({
      reportBrand: plgCap.whiteLabelExport
        ? { logo_url: brandingLogoUrl, org_name: brandingOrgName }
        : null,
    })
  }, [formResults, clerkUserId, pipeline.actions, plgCap.whiteLabelExport, brandingLogoUrl, brandingOrgName])

  const phase = loading ? "loading" : formResults ? "results" : "input"

  const runSimulationFromBridge = useCallback(() => {
    const {
      year,
      companyContext,
      services,
      expenses,
      companyRegime: regime,
      imobiliarioRedutorAjusteBrl: redutor,
      setSubmitValidationError,
    } = useTaxStore.getState()
    // Etapa N/PR 7 (fato 9) — mesma validação do clique em "Simular" (o
    // atalho ⌘Enter não passa pelo <form>, então não pode reusar
    // handleSubmit direto): antes, `if (validServices.length === 0) return`
    // era um no-op completo — quem apertasse o atalho sem nada preenchido
    // não tinha nenhum jeito de descobrir por quê. A mensagem grava no
    // store e aparece no formulário (sempre montado durante a fase input).
    const result = validateSimulationLines(services, expenses)
    if (!result.ok) {
      setSubmitValidationError(result.message, result.invalidLineIds)
      return
    }
    pipeline.actions.runSimulation({
      year: clampSimulationYear(year),
      services: result.validServices,
      expenses: result.validExpenses,
      companyContext,
      companyRegime: regime,
      imobiliarioRedutorAjusteBrl: redutor,
      companyId,
      reportBrand: reportBrandForRun,
    })
  }, [pipeline.actions, companyId, reportBrandForRun])

  useEffect(() => {
    // FE-3 (PR 3c): a distinção form vs. importer saiu daqui — o painel de
    // entrada agora tem abas internas (DashboardInputPanel). "isInputPhase"
    // cobre as duas; consequência declarada: os atalhos "a"/"d" (adicionar
    // serviço/despesa) e as quick actions do CommandMenu ficam disponíveis em
    // qualquer aba do painel de entrada, não só na aba do formulário.
    const isInputPhase = phase === "input"
    const canBoard = Boolean(formResults) && !loading
    const proFormResults = isProOrPremium && Boolean(formResults) && !loading
    setDashboardCommandBridge({
      runSimulation: isInputPhase && !loading ? runSimulationFromBridge : null,
      toggleBoardReady: canBoard ? handlePresentationMode : null,
      isSimulationInputPhase: isInputPhase,
      hasFormResults: Boolean(formResults),
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
    loading,
    formResults,
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
          machineStatus === "running" && "dashboard-pipeline-glow--pulse",
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
            formResults && "no-print",
          )}
        >
          <ShellBreadcrumb items={breadcrumbItems} />
        </div>

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-end gap-3",
            boardReadyActive ? "sm:justify-end" : "sm:justify-between",
          )}
        >
          <div className={cn("space-y-0.5", formResults && "board-ready:hidden")}>
            <h1 className="text-2xl font-bold tracking-tight">Simulador de Reforma Tributária</h1>
            <p className="text-sm text-muted-foreground">
              Calcule o impacto da transição CBS/IBS com classificação de créditos por IA.
            </p>
            {!boardReadyActive && (
              <PipelineStageCompass stage={pipelineStage} className="pt-0.5" />
            )}
          </div>

          {/* Botões quando há resultado */}
          {formResults && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
              {formResults.meta && (
                <Link
                  href={historyHref}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "board-ready:hidden no-print print:hidden",
                  )}
                >
                  {companyId ? "Voltar ao cliente" : "Voltar ao histórico"}
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="board-ready:hidden no-print print:hidden"
              >
                ← Nova simulação
              </Button>
              {/* Entrada: visível assim que há resultado, antes de ativar o modo.
                  handlePresentationMode já trata o teaser Free internamente —
                  antes desta linha, o único acesso era o atalho de teclado "B"
                  ou a command palette (achado 7, docs/product/anexo-a). */}
              {!boardReadyActive && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePresentationMode}
                  className="board-ready:hidden no-print print:hidden gap-1.5 border-border/60 hover:border-emerald-500/40"
                >
                  <Monitor className="h-4 w-4 shrink-0" aria-hidden />
                  Modo apresentação
                </Button>
              )}
              {/* Saída: volta ao modo edição. */}
              {boardReadyActive && (
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
              {!isComparing && !loading && (
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
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <strong>Erro:</strong> {error}
            {mutationRequestId ? <RequestIdSupportRow requestId={mutationRequestId} /> : null}
          </div>
        )}

        {/* ── Falha ao salvar (Etapa M/PR 8) ──────────────────────────────── */}
        {persistFailureDetail && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          >
            <div className="min-w-0">
              <strong>Não foi possível salvar esta simulação.</strong>{" "}
              <span className="text-destructive/90">{persistFailureDetail.message}</span>
              {persistFailureDetail.requestId ? (
                <RequestIdSupportRow requestId={persistFailureDetail.requestId} />
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retryPersist}
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              Tentar novamente
            </Button>
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
              <DashboardInputPanel
                importerEntries={importerEntries}
                isComparing={isComparing}
                loading={loading}
                onFormSubmit={handleFormSubmit}
                onModeChange={reset}
              />
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
              <PipelineStageProgress stage={pipelineStage} shouldReduceMotion={shouldReduceMotion} />
            </motion.div>
          )}

          {phase === "results" && formResults && (
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
                recalcErrorMessage={recalcErrorMessage}
                onApplyOverride={pipeline.actions.applyOverride}
                onRemoveOverride={pipeline.actions.removeOverride}
                onRequestRecalc={pipeline.actions.requestRecalc}
                shouldReduceMotion={shouldReduceMotion}
                renderDossier={renderDossier}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
