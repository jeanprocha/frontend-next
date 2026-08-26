"use client"

import { useCallback, useMemo, useState, type ReactNode } from "react"
import { useReducedMotion } from "motion/react"
import { FinancialVerdictHeroCard } from "@/components/tax/financial-verdict-hero-card"
import { VerdictThesisPanel } from "@/components/tax/verdict-thesis-panel"
import { AuditConfidenceTabs } from "@/components/tax/audit-confidence-tabs"
import { ComparisonVerdictCard } from "@/components/tax/comparison-verdict-card"
import { ExpenseSemanticAuditTable } from "@/components/tax/expense-semantic-audit-table"
import { ExpenseTable } from "@/components/tax/expense-table"
import { SIMULATION_RESULTS_ANCHORS, SimulationResultsStickyIndex, type SimulationResultsAnchorKey } from "@/components/tax/simulation-results-sticky-index"
import { SimulationSessionAuthorityStamp } from "@/components/tax/simulation-session-authority-stamp"
import { TribiaInsights } from "@/components/tax/tribia-insights"
import { aggregateClassifications } from "@/lib/classification-aggregates"
import type { TransitionEsteiraUi } from "@/lib/transition-esteira-ui"
import type { ResultMeta } from "@/store/useTaxStore"
import type {
  AuditTabValue,
  SimulationEsteiraProps,
} from "@/lib/simulation-esteira-types"
import { cn } from "@/lib/utils"
import type {
  AiMetadata,
  ClassificationItem,
  FormExpense,
  FormService,
  SimulationResponse,
} from "@/types/api"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface SimulationResultsTopDownProps {
  showSessionOneHero: boolean
  showExecutiveVerdict: boolean
  insightResult: SimulationResponse
  insightSimulationRunYear?: number
  insightOmitWhenVereditoCovers?: boolean
  summaryResult: SimulationResponse
  summaryCompareBaseline?: SimulationResponse
  summaryOverlapAnatomy: boolean
  summarySimulationRunYear?: number
  summaryHideDeltaCard: boolean
  simulation: SimulationResponse
  aiMetadata: AiMetadata | null | undefined
  classifications: ClassificationItem[]
  services: FormService[]
  expenses: FormExpense[]
  companyContext: string
  focusYear: number
  seriesEnriched?: boolean
  showTransitionAuditFactors: boolean
  presentationMode?: boolean
  verdictThesisPending?: boolean
  transitionUi: TransitionEsteiraUi
  sessionCompanyLabel?: string
  /** Metadados do último guardar / sessão (export CSV de memória PRO). */
  resultMeta?: ResultMeta
  sessionScenarioLabel?: string
  /** CTA de dossié (Partilhar relatório) — colocado junto ao carimbo de sessão. */
  dossierSlot?: ReactNode
  /** Sair do modo comparação (visão única). */
  onRequestSingleView?: () => void
  /** Congelar simulação actual como A e entrar em comparação (exige tier Pro). */
  onRequestComparisonView?: () => void
  isComparing?: boolean
  className?: string
  pendingSimulationSync?: boolean
  isRecalculating?: boolean
  onApplyOverride?: (
    clientId: string,
    override: import("@/types/api").ConsultantClassificationOverride,
  ) => void
  onRemoveOverride?: (clientId: string) => void
  onRequestRecalc?: () => void
  headerBannersSlot?: React.ReactNode
  /** Conteúdo à direita da linha Empresa / Cenário (ex.: «Simulação do histórico»). */
  sessionStampAsideSlot?: React.ReactNode
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Cockpit de autoridade: Barra de contexto → Hero executivo → Esteira (tabs) → Mesa.
 */
export function SimulationResultsTopDown({
  showSessionOneHero,
  showExecutiveVerdict,
  insightResult,
  insightSimulationRunYear,
  insightOmitWhenVereditoCovers,
  summaryResult,
  summaryCompareBaseline,
  summaryOverlapAnatomy,
  summarySimulationRunYear,
  summaryHideDeltaCard,
  simulation,
  aiMetadata,
  classifications,
  services,
  expenses,
  companyContext,
  focusYear,
  seriesEnriched,
  showTransitionAuditFactors,
  presentationMode = false,
  verdictThesisPending = false,
  transitionUi,
  sessionCompanyLabel = "",
  sessionScenarioLabel = "",
  resultMeta,
  dossierSlot,
  onRequestSingleView,
  onRequestComparisonView,
  isComparing = false,
  className,
  pendingSimulationSync = false,
  isRecalculating = false,
  onApplyOverride,
  onRemoveOverride,
  onRequestRecalc,
  headerBannersSlot,
  sessionStampAsideSlot,
}: SimulationResultsTopDownProps) {
  const [activeTab, setActiveTab] = useState<SimulationResultsAnchorKey>("veredito")
  const shouldReduceMotion = useReducedMotion()

  const aggregates = aggregateClassifications(classifications)
  const showCreditsRagLegend = Boolean(aiMetadata)
  const leaks = simulation.credit_leaks ?? []

  const handleEsteiraTabChange = useCallback(
    (t: AuditTabValue) => {
      if (typeof document === "undefined") return
      let targetId = "tribia-esteira-de-confianca"
      if (t === "rag") targetId = "tribia-dossie-auditoria"
      if (t === "go") targetId = "tribia-journey-transicao"
      if (t === "dados") targetId = "tribia-journey-dados"
      if (t === "classificacao") targetId = "tribia-mesa-operacoes"
      
      document.getElementById(targetId)?.scrollIntoView({
        behavior: shouldReduceMotion ? "instant" : "smooth",
        block: "start",
      })
    },
    [shouldReduceMotion],
  )

  const esteira: SimulationEsteiraProps = useMemo(
    () => ({
      simulation,
      services,
      expenses,
      companyContext,
      classifications,
      aiMetadata,
      focusYear,
      seriesEnriched,
      showTransitionAuditFactors,
      presentationMode,
      transitionUi,
      summaryResult,
      summaryCompareBaseline,
      summaryOverlapAnatomy,
      summarySimulationRunYear,
      summaryHideDeltaCard,
      isRecalculating,
      pendingSimulationSync,
      onEsteiraTabChange: handleEsteiraTabChange,
      memoryExportLabel: sessionCompanyLabel?.trim() || undefined,
      memoryExportMeta: resultMeta
        ? { sessionCreatedAt: resultMeta.createdAt }
        : undefined,
    }),
    [
      simulation,
      services,
      expenses,
      companyContext,
      classifications,
      aiMetadata,
      focusYear,
      seriesEnriched,
      showTransitionAuditFactors,
      presentationMode,
      transitionUi,
      summaryResult,
      summaryCompareBaseline,
      summaryOverlapAnatomy,
      summarySimulationRunYear,
      summaryHideDeltaCard,
      isRecalculating,
      pendingSimulationSync,
      handleEsteiraTabChange,
      sessionCompanyLabel,
      resultMeta,
    ],
  )

  const thesisIsStale =
    classifications.some((c) => Boolean(c.consultant_override)) &&
    Boolean(simulation.strategy_insight?.trim())

  const sectionShell = presentationMode
    ? "scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent"
    : "scroll-mt-36 break-inside-avoid border-0 bg-transparent shadow-none print:bg-transparent"
  const sectionVeredito = presentationMode
    ? "scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent"
    : "scroll-mt-36 break-inside-avoid border-0 bg-transparent shadow-none print:bg-transparent"
  const unifiedDossierCardClass = cn(
    "overflow-hidden rounded-xl border border-border/80 bg-card/90 shadow-sm",
    "print:overflow-visible print:rounded-none print:border print:border-foreground/20 print:shadow-none print:bg-transparent",
  )

  const tabSections = (
    <>
        {(presentationMode || activeTab === "veredito") && (
        <section
          id={SIMULATION_RESULTS_ANCHORS.veredito}
          aria-labelledby={
            showSessionOneHero
              ? "tribia-session-authority-title"
              : showExecutiveVerdict
                ? "tribia-fvh-title"
                : "tribia-veredito-comparativo-note"
          }
          className={sectionVeredito}
        >
          <div className="p-5 sm:p-6 print:p-0">
            {showSessionOneHero ? (
              <h2
                id="tribia-session-authority-title"
                className={cn(
                  "mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                  "board-ready:font-board-report board-ready:text-base board-ready:normal-case board-ready:tracking-normal board-ready:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="mr-2 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden"
                >
                  1
                </span>
                Sessão 1 — Veredito de autoridade
              </h2>
            ) : null}

            {showExecutiveVerdict ? (
              <>
                <div
                  className={cn(
                    "mb-6 grid grid-cols-1 gap-6",
                    "md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:items-stretch",
                    "print:mb-4 print:grid-cols-1 print:gap-4",
                    "board-ready:grid-cols-1 board-ready:gap-4",
                  )}
                >
                  <FinancialVerdictHeroCard
                    simulation={simulation}
                    presentationMode={presentationMode}
                    isRecalculating={isRecalculating}
                    pendingSimulationSync={pendingSimulationSync}
                  />
                  <VerdictThesisPanel
                    markdown={simulation.strategy_insight}
                    scoreRaw={aiMetadata?.confidence_score}
                    evidenceCoverageRaw={
                      aiMetadata?.breakdown?.evidence_coverage != null &&
                      Number.isFinite(aiMetadata.breakdown.evidence_coverage)
                        ? aiMetadata.breakdown.evidence_coverage
                        : null
                    }
                    presentationMode={presentationMode}
                    pending={verdictThesisPending}
                    thesisIsStale={thesisIsStale}
                    isRecalculating={isRecalculating}
                    pendingSimulationSync={pendingSimulationSync}
                  />
                </div>
                <ComparisonVerdictCard
                  mode="single"
                  layout="cockpit"
                  currentSimulation={simulation}
                  strategyInsight={simulation.strategy_insight}
                  ragSources={aiMetadata?.sources_analyzed ?? null}
                  onEsteiraTabChange={handleEsteiraTabChange}
                  aiMetadata={aiMetadata}
                  classifications={classifications}
                  expenses={expenses}
                  executiveThesisDisplayed={Boolean(simulation.strategy_insight?.trim())}
                  insightSlot={
                    <TribiaInsights
                      result={insightResult}
                      simulationRunYear={insightSimulationRunYear}
                      omitWhenVereditoCovers={insightOmitWhenVereditoCovers}
                    />
                  }
                />
              </>
            ) : (
              <div>
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
              </div>
            )}
          </div>
        </section>
        )}

        {(presentationMode || activeTab === "cronograma" || activeTab === "dossie") && (
        <section
          className={cn(
            sectionShell,
            "flex flex-col xl:flex-row overflow-hidden",
          )}
        >
          <div className="print:mt-4 print:break-inside-avoid">
            <AuditConfidenceTabs
              {...esteira}
              esteiraTab={activeTab === "cronograma" ? "go" : activeTab === "dossie" ? "rag" : "dados"}
              point={esteira.simulation.transition_series?.find((p) => p.year === esteira.focusYear)}
            />
          </div>
        </section>
        )}

        {(presentationMode || activeTab === "mesa") && (
        <section
          id={SIMULATION_RESULTS_ANCHORS.mesa}
          aria-labelledby="tribia-section-mesa-title"
          className={cn(sectionShell, "print:mt-6 print:break-before-page print:pt-0")}
        >
          <div className="p-5 sm:p-6 print:p-0">
            <MesaHeader id="tribia-section-mesa-title" />
            <p className="line-clamp-2 text-xs leading-snug text-foreground print:hidden">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground print:text-foreground/80">
                Triagem semântica
              </span>
              {" — "}
              confiança média{" "}
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {aggregates.meanConfidence != null
                  ? `${Math.round(aggregates.meanConfidence * 100)}%`
                  : "—"}
              </span>
              {aggregates.regimeCounts.length > 0 ? (
                <>
                  {" · "}
                  {aggregates.regimeCounts.map((r, i) => (
                    <span key={r.key}>
                      {i > 0 ? " · " : null}
                      {r.label} {r.pct}% ({r.count})
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-muted-foreground"> · sem regimes contabilizados</span>
              )}
              {aggregates.errorCount > 0 ? (
                <span className="text-amber-800 dark:text-amber-200">
                  {" · "}
                  {aggregates.errorCount} linha(s) com erro
                </span>
              ) : null}
            </p>

            <div id="tribia-semantic-audit-table" className="mt-5 scroll-mt-28 print:mt-4">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                  presentationMode &&
                    "font-board-report text-sm font-semibold normal-case tracking-normal text-foreground",
                )}
              >
                Rastreabilidade por linha
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground print:hidden">
                Espelho cego do input — cada linha prova a classificação semântica atribuída
                pela IA ao montante processado pelo motor Go.
                {!presentationMode && (
                  <> Clique em qualquer classificação para substituir manualmente.</>
                )}
              </p>

              {pendingSimulationSync && !presentationMode && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-300/60 bg-amber-50/50 px-3 py-2 print:hidden dark:border-amber-700/40 dark:bg-amber-950/20"
                >
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
                    Classificações alteradas — os números acima ainda reflectem a simulação
                    anterior.
                  </p>
                  <button
                    type="button"
                    onClick={onRequestRecalc}
                    disabled={isRecalculating}
                    className={cn(
                      "tribia-touch-target min-h-11 shrink-0 rounded-md border border-amber-400/70 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors",
                      "hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                      "dark:border-amber-600/50 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    {isRecalculating ? "Calculando…" : "Recalcular impacto"}
                  </button>
                </div>
              )}

              <div className="mt-3 print:mt-2">
                <ExpenseSemanticAuditTable
                  expenses={expenses}
                  classifications={classifications}
                  creditLeaks={simulation.credit_leaks}
                  presentationMode={presentationMode}
                  ariaDescribedBy="tribia-semantic-audit-table"
                  onApplyOverride={onApplyOverride}
                  onRemoveOverride={onRemoveOverride}
                />
              </div>
            </div>

            {leaks.length === 0 ? (
              <div className="mt-4 rounded-lg border border-border/60 bg-muted/15 px-3 py-3 text-[11px] leading-relaxed text-muted-foreground print:border-foreground/20 print:bg-transparent">
                <p className="font-semibold text-foreground/90">Custo morto (exemplo ilustrativo)</p>
                <p className="mt-1.5 print:text-foreground/85">
                  Uma assinatura de software ou streaming (por exemplo, Netflix) pode ser elegível
                  a crédito quando o serviço estiver ligado à produção da receita tributável — mas
                  se a linha não for enquadrada ou não houver nexo documental na LC 68/2024, o
                  benefício deixa de ser recuperável: vira{" "}
                  <span className="font-medium text-foreground/90">custo morto</span> para efeitos
                  de crédito nesta simulação. O motor não «adivinha» elegibilidade; a tabela abaixo
                  mostra o enquadramento por linha; o detalhe de confiança e nexo RAG está na
                  Cédula (Ver lei).
                </p>
                <p className="mt-2 text-[10px] italic text-muted-foreground/90 print:text-muted-foreground">
                  Exemplo didáctico, não posição fiscal definitiva — valide com a área fiscal e o
                  perfil real da empresa.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground print:text-foreground/80">
                O exemplo Netflix acima resume a lógica quando não há nexo; com vazamentos
                detectados, priorize as linhas do alerta e a tabela abaixo.
              </p>
            )}

            <div
              id="tribia-journey-creditos"
              className="scroll-mt-28 mt-5 w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card/50 print:mt-4 print:rounded-md print:border-foreground/20 print:bg-transparent"
            >
              <div className="border-b border-border/60 bg-muted/25 px-4 py-3 print:border-foreground/20 print:bg-transparent">
                <h3
                  className={cn(
                    "text-sm font-semibold",
                    presentationMode && "font-board-report text-base",
                  )}
                >
                  <span className="board-ready:hidden print:hidden">Análise de Créditos — IA</span>
                  <span className="hidden board-ready:inline print:inline">
                    Fundamentação de créditos — LC 68/2024
                  </span>
                </h3>
                {showCreditsRagLegend ? (
                  <p
                    id="tribia-credits-rag-legend"
                    className="mt-1 text-xs leading-relaxed text-muted-foreground print:text-foreground/85"
                  >
                    O índice de auditoria acima sintetiza a conformidade global; cada linha abaixo
                    mostra a fundamentação na LC 68/2024.
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground board-ready:hidden print:hidden">
                  Borda à esquerda: verde elegível, âmbar atenção (inelegível ou vazamento de
                  crédito), ardósia neutro. &quot;Ver lei&quot; abre a Cédula de auditoria
                  (diagnóstico, evidências e dispositivo legal LC 68/2024).
                </p>
              </div>
              <ExpenseTable
                expenses={expenses}
                classifications={classifications}
                creditLeaks={simulation.credit_leaks}
                presentationMode={presentationMode}
                ariaDescribedBy={showCreditsRagLegend ? "tribia-credits-rag-legend" : undefined}
              />
            </div>
          </div>
        </section>
        )}
    </>
  )

  return (
    <>
      {headerBannersSlot ? (
        <div className="print:hidden board-ready:hidden flex flex-col gap-3">
          {headerBannersSlot}
        </div>
      ) : null}

      <div className={cn("print:space-y-0", className)}>
        {!presentationMode ? (
          <div className={unifiedDossierCardClass}>
            <div className="px-3 sm:px-4">
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-3 py-2.5 sm:gap-4 sm:py-3",
                  sessionStampAsideSlot && "sm:flex-row sm:items-center sm:justify-between",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <SimulationSessionAuthorityStamp
                    sessionCompanyLabel={sessionCompanyLabel}
                    sessionScenarioLabel={sessionScenarioLabel}
                    className="min-w-0 py-0"
                  />
                  {dossierSlot ? <div className="shrink-0 sm:ml-auto">{dossierSlot}</div> : null}
                </div>
                {sessionStampAsideSlot ? (
                  <div className="w-full min-w-0 sm:w-auto sm:max-w-[min(100%,28rem)] sm:shrink sm:pl-2">
                    {sessionStampAsideSlot}
                  </div>
                ) : null}
              </div>
            </div>
            <SimulationResultsStickyIndex
              activeTab={activeTab}
              onChangeTab={setActiveTab}
            />
            {tabSections}
          </div>
        ) : (
          tabSections
        )}
      </div>
    </>
  )
}

function MesaHeader({ id }: { id: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 print:mb-3">
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden"
      >
        4
      </span>
      <h2
        id={id}
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
          "board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground",
        )}
      >
        Mesa de Operações
      </h2>
    </div>
  )
}
