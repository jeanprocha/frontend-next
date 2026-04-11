"use client"

import dynamic from "next/dynamic"
import { useCallback, useState } from "react"
import { useReducedMotion } from "motion/react"
import { FinancialVerdictHeroCard } from "@/components/tax/financial-verdict-hero-card"
import { VerdictThesisPanel } from "@/components/tax/verdict-thesis-panel"
import { BoardReadyPresentationCta } from "@/components/tax/board-ready-presentation-cta"
import { BoardAuditCertificate } from "@/components/tax/board-audit-certificate"
import { BoardLegalCoverageShield } from "@/components/tax/board-legal-coverage-shield"
import { ComparisonVerdictCard } from "@/components/tax/comparison-verdict-card"
import { CreditLeakageAlert } from "@/components/tax/credit-leakage-alert"
import { ExpenseSemanticAuditTable } from "@/components/tax/expense-semantic-audit-table"
import { ExpenseTable } from "@/components/tax/expense-table"
import { LawPdfAuthorityCard } from "@/components/tax/law-pdf-authority-card"
import { RagAuditCard } from "@/components/tax/rag-audit-card"
import { SIMULATION_RESULTS_ANCHORS } from "@/components/tax/simulation-results-sticky-index"
import { SimulationResultsDossierStickyChrome } from "@/components/tax/simulation-results-dossier-sticky-chrome"
import { SummaryCards } from "@/components/tax/summary-cards"
import { TransitionAuditPanel } from "@/components/tax/transition-audit-panel"
import { TransitionAuditPanelBody } from "@/components/tax/transition-audit-panel-body"
import { TransitionGoPeaksMarcos } from "@/components/tax/transition-go-peaks-marcos"
import { TribiaInsights } from "@/components/tax/tribia-insights"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBRL } from "@/lib/api"
import {
  formatRegulatoryFactorDisplay,
  formatRegulatoryFactorPair,
} from "@/lib/format-regulatory-factor"
import { parseApiDecimal } from "@/lib/money-decimal"
import { factorTransitionAuditTooltip } from "@/lib/transition-audit-copy"
import { aggregateClassifications } from "@/lib/classification-aggregates"
import {
  confidenceTierFromScore01,
  humanSolidityHintFromAggregatedScore01,
} from "@/lib/confidence-tiers"
import {
  avgEvidenceCountAmongLinesWithEvidence,
  computeExpenseEvidenceCoverage,
  countTenuousNexusLines,
} from "@/lib/rag-tab-stats"
import { resolveHeroEvidencePick } from "@/lib/session-authority-evidence"
import type { TransitionEsteiraUi } from "@/lib/transition-esteira-ui"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import type {
  AiMetadata,
  ClassificationItem,
  FormExpense,
  FormService,
  SimulationResponse,
} from "@/types/api"

// ─── Lazy ────────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return <Skeleton className="h-[min(360px,50vh)] w-full min-h-[200px] rounded-xl" />
}

const TransitionChartLazy = dynamic(
  () => import("@/components/tax/transition-chart").then((m) => m.TransitionChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const SankeyFlowLazy = dynamic(
  () => import("@/components/tax/sankey-flow").then((m) => m.SankeyFlow),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Série temporal 2026-2033 com ponto de foco destacado. */
function MotorGoTransitionTimeline({
  years,
  focusYear,
}: {
  years: number[]
  focusYear: number
}) {
  const sorted = [...years].sort((a, b) => a - b)
  const minY = sorted[0] ?? focusYear
  const maxY = sorted[sorted.length - 1] ?? focusYear
  const span = Math.max(1, maxY - minY)
  const focusPos = sorted.length ? ((focusYear - minY) / span) * 100 : 50

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Série de transição 2026–2033
      </p>
      <div className="relative pt-1">
        <div className="h-1.5 rounded-full bg-muted" aria-hidden />
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-600 bg-card shadow-sm"
          style={{ left: `${Math.min(100, Math.max(0, focusPos))}%` }}
          title={`Ano de foco ${focusYear} na rampa`}
          aria-hidden
        />
      </div>
      <ul className="flex flex-wrap items-center gap-2">
        {sorted.map((y) => {
          const isFocus = y === focusYear
          return (
            <li key={y}>
              <span
                className={cn(
                  "inline-flex min-w-[3.25rem] justify-center rounded-md border px-2 py-1 font-mono tabular-nums transition-colors",
                  isFocus
                    ? "border-emerald-600/60 bg-emerald-600/15 text-sm font-semibold text-foreground ring-2 ring-emerald-500/25"
                    : "border-border/60 bg-muted/30 text-[11px] text-muted-foreground",
                )}
              >
                {y}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] leading-snug text-muted-foreground">
        O ano de foco posiciona-se na rampa de convivência entre regimes; os valores desta secção
        são reprodutíveis para esse ano e auditáveis externamente.
      </p>
    </div>
  )
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface SimulationResultsTopDownProps {
  /** Quando true: cabeçalho Sessão 1 (utilizador autenticado sem A/B). */
  showSessionOneHero: boolean
  /** Veredito executivo (modo single). Falso em A/B: o cartão comparativo está acima. */
  showExecutiveVerdict: boolean
  insightResult: SimulationResponse
  insightSimulationRunYear?: number
  insightOmitWhenVereditoCovers?: boolean
  summaryResult: SimulationResponse
  summaryCompareBaseline?: SimulationResponse
  summaryOverlapAnatomy: boolean
  summarySimulationRunYear?: number
  /** Evitar delta duplicado quando o hero do Veredito já o mostra. */
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
  /** Modo apresentação Board-Ready — alinha tipografia e tabela. */
  presentationMode?: boolean
  /**
   * true enquanto o parecer executivo estiver a ser gerado (ex.: stream futuro).
   * Hoje o POST devolve tudo junto; default false.
   * Mantido para suportar desacoplamento sem quebra de API.
   */
  verdictThesisPending?: boolean
  transitionUi: TransitionEsteiraUi
  /**
   * Label de empresa derivado em page.tsx (heurística nome + fallback).
   * Alimenta o carimbo de autoridade sticky e o masthead de impressão.
   */
  sessionCompanyLabel?: string
  /** Label do cenário activo (simulação base, A/B, ano). */
  sessionScenarioLabel?: string
  /**
   * Toolbar da Barra de Contexto (item 1.2.3):
   * Pro/Premium: modo desbloqueado — toggle activa Board-Ready.
   * Free: undefined/false — clique só abre Teaser PRO, sem activar o modo.
   */
  boardReadyUnlocked?: boolean
  /** Callback Pro: alterna presentationMode (via use-board-ready → useTaxStore). */
  onPresentationToggle?: () => void
  /** Callback Free: abre BoardReadyTeaseSheet — nunca activa presentationMode. */
  onPresentationTease?: () => void
  /**
   * Modo de visão activo — reflectido no pill estático 1.2.2
   * (placeholder visual; lógica de carregamento A/B permanece em page.tsx).
   */
  isComparing?: boolean
  className?: string

  // ── 3.4.1 Override manual ──────────────────────────────────────────────────
  /** Overrides pendentes de recálculo no motor Go. */
  pendingSimulationSync?: boolean
  /** Verdadeiro durante o POST de recálculo. */
  isRecalculating?: boolean
  /** Chamado quando o consultor aplica um override numa linha. */
  onApplyOverride?: (clientId: string, override: import("@/types/api").ConsultantClassificationOverride) => void
  /** Chamado quando o consultor remove um override. */
  onRemoveOverride?: (clientId: string) => void
  /** Dispara o recálculo no motor Go. */
  onRequestRecalc?: () => void
}

// ─── Componente ──────────────────────────────────────────────────────────────

/**
 * Orquestrador Top-Down da página de resultados.
 * Cinco secções verticais (Contexto → Veredito → Cronograma → Auditoria → Mesa)
 * substituem o modelo de abas, permitindo storytelling por scroll ou setas
 * durante apresentações para CFOs e consultores.
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
  boardReadyUnlocked,
  onPresentationToggle,
  onPresentationTease,
  isComparing = false,
  className,
  pendingSimulationSync = false,
  isRecalculating = false,
  onApplyOverride,
  onRemoveOverride,
  onRequestRecalc,
}: SimulationResultsTopDownProps) {
  const [memoryOpen, setMemoryOpen] = useState(false)
  const openMacroBriefing = useTaxStore((s) => s.openAnalystBriefingFromMacro)
  const shouldReduceMotion = useReducedMotion()

  // Dados derivados — RAG e classificações
  const aggregates = aggregateClassifications(classifications)
  const heroPick = resolveHeroEvidencePick(classifications, expenses)
  const score = aiMetadata?.confidence_score
  const tier =
    score != null && Number.isFinite(score) ? confidenceTierFromScore01(score) : null
  const breakdown = aiMetadata?.breakdown
  const coveragePct =
    breakdown && Number.isFinite(breakdown.evidence_coverage)
      ? Math.round(Math.min(1, Math.max(0, breakdown.evidence_coverage)) * 100)
      : null
  const expenseCov = computeExpenseEvidenceCoverage(expenses, classifications)
  const avgEvPerLine = avgEvidenceCountAmongLinesWithEvidence(classifications)
  const tenuousLineCount = countTenuousNexusLines(classifications)
  const literalPct =
    breakdown && Number.isFinite(breakdown.llm_confidence_mean)
      ? Math.round(Math.min(1, Math.max(0, breakdown.llm_confidence_mean)) * 100)
      : null
  const solidityHint =
    score != null && Number.isFinite(score) ? humanSolidityHintFromAggregatedScore01(score) : null
  const showCreditsRagLegend = Boolean(aiMetadata)

  const revenue = simulation.revenue_total
  const itemCount = services.length + expenses.length
  const leaks = simulation.credit_leaks ?? []
  const point = simulation.transition_series?.find((p) => p.year === focusYear)

  // Callback: clique no gauge do Veredito → scroll para Auditoria (substitui mudança de tab).
  // () => void é assignável a (tab: AuditTabValue) => void por contravariância de parâmetros.
  const handleVereditoTabChange = useCallback(
    () => {
      const el = document.getElementById(SIMULATION_RESULTS_ANCHORS.auditoria)
      el?.scrollIntoView({ behavior: shouldReduceMotion ? "instant" : "smooth", block: "start" })
    },
    [shouldReduceMotion],
  )

  // ── 3.4.2 Coerência RAG: insight stale ──────────────────────────────────
  // Verdadeiro quando existem overrides activos + há insight: o texto da IA
  // reflecte a simulação original, não os números recalculados pelo Go.
  // Passado ao VerdictThesisPanel para exibir nota anti-contradição (whisper-quiet).
  const thesisIsStale =
    classifications.some((c) => Boolean(c.consultant_override)) &&
    Boolean(simulation.strategy_insight?.trim())

  // ── Toolbar slot (item 1.2.3) ─────────────────────────────────────────────
  // Composta quando o pai passou handlers — indica que há resultado form activo.
  // Esquerda: pill estático de visão 1.2.2 (placeholder; lógica em page.tsx).
  // Centro (3.4.2): «Sincronizar Parecer» — só em Board-Ready + overrides pendentes.
  // Direita (ml-auto): CTA Board-Ready como elemento principal da faixa.
  const toolbarSlot =
    boardReadyUnlocked !== undefined &&
    (onPresentationToggle !== undefined || onPresentationTease !== undefined) ? (
      <div className="flex items-center justify-between gap-2">
        {/* ── Visão única | Comparação A/B — pill informativo 1.2.2 ─────── */}
        <div aria-live="polite" aria-atomic="true">
          {isComparing ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-50/70 px-2 py-1 text-xs font-medium text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/40 dark:text-emerald-100">
              Comparação A/B
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
              Visão única
            </span>
          )}
        </div>

        {/*
         * ── Sincronizar Parecer (3.4.2 — salvaguarda Board-Ready) ──────
         * Visível apenas em modo apresentação com overrides pendentes.
         * Tom institucional: sem herói visual, sem destaque neon.
         * Garante que o consultor controla o momento exacto em que o
         * relatório oficial muda perante o cliente (system.md modo apresentação).
         */}
        {presentationMode && pendingSimulationSync && onRequestRecalc && (
          <button
            type="button"
            onClick={onRequestRecalc}
            disabled={isRecalculating}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1",
              "text-xs font-medium text-foreground/80 transition-colors",
              "hover:border-emerald-500/40 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isRecalculating ? "Sincronizando…" : "Sincronizar Parecer"}
          </button>
        )}

        {/* ── CTA Board-Ready — CTA principal da barra (item 1.2.3) ────── */}
        <BoardReadyPresentationCta
          unlocked={boardReadyUnlocked}
          active={presentationMode}
          onProToggle={onPresentationToggle ?? (() => undefined)}
          onFreeTease={onPresentationTease ?? (() => undefined)}
        />
      </div>
    ) : undefined

  // Classes comuns de secção
  // scroll-mt-36 (144px) = navbar 56px + chrome unificado ~80px + buffer:
  // garante que o título da secção não fica colado sob o chrome ao saltar por âncora.
  const sectionBase =
    "scroll-mt-36 rounded-xl border border-border/80 bg-card tribia-shadow-elevated break-inside-avoid"

  // Variante para a secção #veredito-executivo: sem tribia-shadow-elevated.
  // A elevação (único pico de dramatismo) pertence exclusivamente ao
  // FinancialVerdictHeroCard interno — evita sombra dupla (system.md "whisper-quiet").
  const sectionVeredito =
    "scroll-mt-36 rounded-xl border border-border/80 bg-card break-inside-avoid"

  return (
    <>
      {/* Chrome sticky unificado: carimbo + toolbar 1.2.2/1.2.3 + índice (item 1.2.1) */}
      <SimulationResultsDossierStickyChrome
        sessionCompanyLabel={sessionCompanyLabel}
        sessionScenarioLabel={sessionScenarioLabel}
        toolbarSlot={toolbarSlot}
      />

      <div className={cn("mt-6 space-y-12", className)}>
        {/* ── Secção 1: Contexto ────────────────────────────────────────── */}
        <section
          id={SIMULATION_RESULTS_ANCHORS.contexto}
          aria-labelledby="tribia-section-contexto-title"
          className={sectionBase}
        >
          {/* Alias legado: #tribia-journey-dados redireciona aqui nativamente */}
          <span id="tribia-journey-dados" aria-hidden className="sr-only" />

          <div className="p-6">
            <SectionHeader
              id="tribia-section-contexto-title"
              step={1}
              label="Contexto"
              boardReadySerif
            />

            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                presentationMode &&
                  "font-board-report text-base font-semibold normal-case text-foreground",
              )}
            >
              Anatomia do resultado
            </p>
            <p
              className={cn(
                "mt-2 text-sm leading-relaxed text-foreground",
                presentationMode && "font-board-report",
              )}
            >
              Porquê do número: volume de insumos e comparativo tributário (legado vs destino)
              antes da prova legal na secção de Auditoria.
            </p>

            {/* Volumes */}
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-slate-800/50 dark:bg-slate-900/40">
                <dt className="text-[11px] text-muted-foreground">Itens processados</dt>
                <dd className="font-sans text-lg font-semibold tabular-nums">{itemCount}</dd>
                <dd className="text-[11px] text-muted-foreground">
                  {services.length} serviço(s) · {expenses.length} despesa(s)
                </dd>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-slate-800/50 dark:bg-slate-900/40">
                <dt className="text-[11px] text-muted-foreground">Faturamento total (receita)</dt>
                <dd className="font-sans text-lg font-semibold tabular-nums">
                  {revenue != null && revenue.trim() !== "" ? formatBRL(revenue) : "—"}
                </dd>
              </div>
            </dl>

            {/* SummaryCards — alias legado #tribia-anatomia-resumo mantido */}
            <div id="tribia-anatomia-resumo" className="mt-6 scroll-mt-28">
              <SummaryCards
                result={summaryResult}
                compareBaseline={summaryCompareBaseline}
                overlapAnatomy={summaryOverlapAnatomy}
                simulationRunYear={summarySimulationRunYear}
                hideDeltaCard={summaryHideDeltaCard}
              />
            </div>

            {/* Contexto da empresa */}
            {companyContext.trim() ? (
              <div className="mt-4 rounded-lg border border-slate-200/60 bg-white/60 px-3 py-2 dark:border-slate-800/50">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Contexto da empresa
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{companyContext}</p>
              </div>
            ) : null}

            {/* RagAuditCard — cobertura textual; solidez jurídica detalhada na Auditoria */}
            <div className="mt-6 border-t border-border/80 pt-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Cobertura textual da lei sobre os insumos desta simulação — a solidez jurídica
                consolidada está na{" "}
                <a
                  href={`#${SIMULATION_RESULTS_ANCHORS.auditoria}`}
                  className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                >
                  secção de Auditoria
                </a>
                .
              </p>
              <div className="mt-3">
                <RagAuditCard
                  aiMetadata={aiMetadata}
                  onOpenBriefing={aiMetadata ? () => openMacroBriefing(aiMetadata) : undefined}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Secção 2: Veredito Executivo ─────────────────────────────── */}
        {/*
         * Política de sombras: secção usa sectionVeredito (sem tribia-shadow-elevated).
         * O único pico de dramatismo é o FinancialVerdictHeroCard interno,
         * que carrega a elevação. Evita sombra dupla (system.md "whisper-quiet").
         */}
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
          <div className="p-6">
            {showSessionOneHero ? (
              <h2
                id="tribia-session-authority-title"
                className={cn(
                  "mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                  "board-ready:font-board-report board-ready:text-base board-ready:normal-case board-ready:tracking-normal board-ready:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="mr-2 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden"
                >
                  2
                </span>
                Sessão 1 — Veredito de autoridade
              </h2>
            ) : null}

            {showExecutiveVerdict ? (
              <>
                {/*
                 * 2.1.1 + 2.2.1 — Grelha Lado A / Lado B.
                 *
                 * Lado A: FinancialVerdictHeroCard — só impacto Go (delta + %).
                 *   Único pico de dramatismo (sombra elevada); mantra Go calcula.
                 *
                 * Lado B: VerdictThesisPanel — parecer executivo (strategy_insight).
                 *   Geist operacional; font-board-report em Board-Ready.
                 *   Separado por border-l md+ (decisão dossiê — system.md).
                 *   Proibido recalcular dados financeiros aqui (tribia_core_rules §1).
                 *
                 * Print / Board-Ready: coluna única (print:grid-cols-1).
                 */}
                <div
                  className={cn(
                    "mb-5 grid grid-cols-1 gap-6",
                    "md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:items-stretch",
                    "print:grid-cols-1 print:gap-4",
                    "board-ready:grid-cols-1 board-ready:gap-4",
                  )}
                >
                  <FinancialVerdictHeroCard
                    simulation={simulation}
                    aiMetadata={aiMetadata}
                    presentationMode={presentationMode}
                    isRecalculating={isRecalculating}
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
                  />
                </div>
                <ComparisonVerdictCard
                  mode="single"
                  layout="cockpit"
                  currentSimulation={simulation}
                  strategyInsight={simulation.strategy_insight}
                  ragSources={aiMetadata?.sources_analyzed ?? null}
                  onEsteiraTabChange={handleVereditoTabChange}
                  aiMetadata={aiMetadata}
                  classifications={classifications}
                  expenses={expenses}
                  /*
                   * O parecer executivo já está no VerdictThesisPanel (Lado B).
                   * Passar true para evitar duplicar o parágrafo LLM aqui.
                   * (tribia_core_rules: um protagonista por ideia)
                   */
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
                  <span aria-hidden className="mr-2 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
                    2
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

        {/* ── Secção 3: Cronograma ─────────────────────────────────────── */}
        {/*
         * ID canónico preservado: #tribia-journey-transicao — bookmarks e links externos
         * continuam a funcionar sem redireccionar.
         */}
        <section
          id={SIMULATION_RESULTS_ANCHORS.cronograma}
          aria-labelledby="tribia-section-cronograma-title"
          className={sectionBase}
        >
          <div className="p-6">
            <SectionHeader
              id="tribia-section-cronograma-title"
              step={3}
              label="Cronograma de Impacto"
              boardReadySerif
            />

            <h3
              className={cn(
                "text-sm font-semibold text-foreground",
                presentationMode && "font-board-report text-base",
              )}
            >
              Rigor Matemático e Auditoria (Motor Go)
            </h3>
            <p
              className={cn(
                "mt-1 text-[11px] font-medium leading-snug text-foreground/90",
                presentationMode && "font-board-report",
              )}
            >
              A IA explica a lei; o Motor Go executa a matemática.
            </p>

            {/* Gráfico de transição + painéis */}
            {transitionUi ? (
              <div className="mt-4 space-y-4 print:break-inside-avoid">
                <TransitionChartLazy
                  result={transitionUi.chartResult}
                  abBaselineResult={transitionUi.abBaselineResult}
                  chartMode={transitionUi.transitionFullChart ? "full" : "sparkline"}
                  focusYear={focusYear}
                  onFocusYearChange={
                    transitionUi.transitionFocusYear ? transitionUi.onFocusYearChange : undefined
                  }
                />
                {transitionUi.transitionAuditFactors ? (
                  <TransitionAuditPanel
                    focusYear={focusYear}
                    point={transitionUi.chartResult.transition_series?.find(
                      (p) => p.year === focusYear,
                    )}
                    seriesEnriched={seriesEnriched}
                  />
                ) : null}
                {transitionUi.transitionDynamicInsights ? (
                  <TransitionGoPeaksMarcos
                    series={transitionUi.chartResult.transition_series}
                    focusYear={focusYear}
                  />
                ) : null}
              </div>
            ) : null}

            {/* Precisão determinística */}
            <div
              className={cn(
                "mt-4 rounded-lg border border-border/50 bg-muted/15 px-3 py-3 dark:bg-muted/20",
                presentationMode && "print:border-foreground/20",
              )}
            >
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                  presentationMode && "font-board-report normal-case text-sm text-foreground",
                )}
              >
                Precisão determinística
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Garantia de precisão para auditoria externa: o motor usa{" "}
                <span className="font-medium text-foreground/90">shopspring/decimal</span> em Go —
                a mesma família de precisão decimal esperada em controlo financeiro — evitando
                erros de arredondamento típicos de{" "}
                <span className="font-mono text-[10px]">float64</span> em pipelines genéricos.
                Valores monetários e alíquotas críticas não passam por ponto flutuante binário na
                conta central.
              </p>
            </div>

            {/* Timeline 2026-2033 */}
            {simulation.transition_series && simulation.transition_series.length > 0 ? (
              <div className="tribia-surface-work mt-4 px-3 py-3 print:break-inside-avoid">
                <MotorGoTransitionTimeline
                  years={simulation.transition_series.map((p) => p.year)}
                  focusYear={focusYear}
                />
              </div>
            ) : null}

            {/* Delta entre regimes */}
            {showTransitionAuditFactors && point?.delta != null ? (
              <div className="tribia-surface-work mt-3 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Delta entre regimes (motor Go)
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Diferença exacta calculada no destino vs. legado para {focusYear} — não é
                  interpretação da IA.
                </p>
                {(() => {
                  const d = parseApiDecimal(point.delta)
                  const saving = d && d.lt(0)
                  const neutral = !d || d.eq(0)
                  return (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatBRL(point.delta)}
                      </span>
                      {!neutral && (
                        <Badge
                          className={cn(
                            "border-0 px-2 py-0.5 text-[10px] font-semibold",
                            saving
                              ? "bg-emerald-600 text-white hover:bg-emerald-600"
                              : "bg-amber-600 text-white hover:bg-amber-600",
                          )}
                        >
                          {saving ? "Economia projetada" : "Aumento de carga"}
                        </Badge>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : null}

            {/* Parâmetros regulamentares */}
            {showTransitionAuditFactors && point?.factors ? (
              <div className="tribia-surface-work mt-3 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Parâmetros regulamentares de transição ({focusYear})
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Fatores de transição e alíquotas de referência aplicados pelo motor para este
                  ano.
                </p>
                <dl className="mt-2 space-y-1.5 text-[11px] tabular-nums text-foreground">
                  <div className="flex justify-between gap-2">
                    <dt
                      className="font-sans font-normal text-muted-foreground"
                      title={factorTransitionAuditTooltip(focusYear, "pis_cofins")}
                    >
                      PIS/COFINS (legado)
                    </dt>
                    <dd className="font-mono">
                      {formatRegulatoryFactorDisplay(point.factors.pis_cofins_factor)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt
                      className="font-sans font-normal text-muted-foreground"
                      title={factorTransitionAuditTooltip(focusYear, "combined")}
                    >
                      CBS + IBS (ref.)
                    </dt>
                    <dd className="font-mono">
                      {point.factors.combined_projected_rate
                        ? formatRegulatoryFactorDisplay(point.factors.combined_projected_rate)
                        : formatRegulatoryFactorPair(
                            point.factors.cbs_rate,
                            point.factors.ibs_rate,
                          )}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                {showTransitionAuditFactors
                  ? "Sem ponto de série para o ano seleccionado."
                  : transitionUi
                    ? "O detalhe completo de fatores por ano está disponível quando o plano inclui fatores de auditoria."
                    : "O detalhe de fatores por ano aparece nesta secção quando disponível no seu plano."}
              </p>
            )}

            {/* Botão de memória de cálculo */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 w-full border-border/80 text-xs sm:w-auto"
              onClick={() => setMemoryOpen(true)}
              disabled={!point}
              aria-label="Abrir certificado de memória de cálculo determinística para o ano de foco"
            >
              Inspecionar memória de cálculo (audit-ready)
            </Button>

            {/* Sankey — oculto na impressão */}
            {transitionUi ? (
              <div className="mt-6 min-w-0 print:hidden">
                <SankeyFlowLazy
                  simulation={transitionUi.chartResult}
                  expenses={expenses}
                  services={services}
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* ── Secção 4: Auditoria ──────────────────────────────────────── */}
        <section
          id={SIMULATION_RESULTS_ANCHORS.auditoria}
          aria-labelledby="tribia-section-auditoria-title"
          className={cn(sectionBase, "print-page-break")}
        >
          <div className="p-6">
            <SectionHeader
              id="tribia-section-auditoria-title"
              step={4}
              label="Dossiê de Auditoria"
            />

            {/*
             * Sub-âncora preservada: #tribia-rag-macro-anchor — links externos e
             * shortcuts internos (ConfidenceGauge) continuam a funcionar.
             */}
            <div id="tribia-rag-macro-anchor" className="scroll-mt-28">
              <h3
                className={cn(
                  "text-sm font-semibold text-foreground",
                  presentationMode && "font-board-report text-base",
                )}
              >
                Veredito de Solidez Jurídica (RAG)
              </h3>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                O sistema auditou e fundamentou cada linha na LC 68/2024; o motor Go mantém os
                valores determinísticos. Esta secção é a prova legal — certificado de cobertura e
                escudo de fundamentação — separada dos números do Contexto.
              </p>

              {!aiMetadata ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Sem metadados de auditoria legislativa nesta simulação. Execute com classificação
                  por IA para ver cobertura, certificado e artigo herói.
                </p>
              ) : (
                <>
                  <BoardLegalCoverageShield
                    className="mt-3"
                    coveragePct={coveragePct}
                    withEvidence={expenseCov.withEvidence}
                    total={expenseCov.total}
                    tier={tier}
                    score={score}
                    solidityHint={solidityHint}
                  />

                  <BoardAuditCertificate
                    className="mt-3"
                    literalPct={literalPct}
                    avgEvPerLine={avgEvPerLine}
                    tenuousLineCount={tenuousLineCount}
                  />

                  {heroPick ? (
                    <div className="tribia-surface-work mt-3 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Artigo herói
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        O dispositivo da lei que concentra o maior montante em despesas elegíveis
                        nesta simulação — ligação directa entre a base de crédito e o artigo da LC
                        68/2024. Em Pro, abra o PDF oficial na página indexada para prova perante o
                        fisco.
                      </p>
                      {heroPick.totalBrl != null ? (
                        <p className="mt-2 text-xs font-medium tabular-nums text-foreground">
                          ~{formatBRL(heroPick.totalBrl.toFixed(2))}{" "}
                          <span className="font-sans font-normal text-muted-foreground">
                            — soma das despesas elegíveis ligadas a este artigo
                          </span>
                        </p>
                      ) : null}
                      {heroPick.evidence.article_id ? (
                        <LawPdfAuthorityCard
                          variant="embedded"
                          chunkArticleId={heroPick.evidence.article_id}
                          eyebrow="Cadeia de custódia"
                        />
                      ) : (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Sem artigo indexado para o PDF.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      Sem evidências para o artigo herói — ver a secção Mesa de Operações.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Secção 5: Mesa de Operações ──────────────────────────────── */}
        <section
          id={SIMULATION_RESULTS_ANCHORS.mesa}
          aria-labelledby="tribia-section-mesa-title"
          className={cn(sectionBase, "print-page-break")}
        >
          <div className="p-6">
            <SectionHeader
              id="tribia-section-mesa-title"
              step={5}
              label="Mesa de Operações"
            />

            {/* Triagem semântica */}
            <p className="line-clamp-2 text-xs leading-snug text-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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

            {/*
             * 3.1.1 — Tabela de rastreabilidade semântica (Abertura da caixa-preta).
             *
             * Posição: após triagem agregada, antes dos alertas de negócio.
             * Narrativa: resumo → prova linha a linha → alertas → tabela completa (3.2+).
             *
             * Tipografia: dados em Geist Sans; font-board-report reservado ao título
             * abaixo (system.md — serif só narrativa/títulos em Board-Ready).
             */}
            <div
              id="tribia-semantic-audit-table"
              className="mt-5 scroll-mt-28"
            >
              {/*
               * Título da sub-secção: único elemento que assume font-board-report
               * em Board-Ready. Os dados tabulares permanecem Geist Sans (ferramenta
               * de precisão — tribia_core_rules §4, system.md Tipografia).
               */}
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                  presentationMode &&
                    "font-board-report text-sm font-semibold normal-case tracking-normal text-foreground",
                )}
              >
                Rastreabilidade por linha
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                Espelho cego do input — cada linha prova a classificação semântica atribuída
                pela IA ao montante processado pelo motor Go.
                {!presentationMode && (
                  <> Clique em qualquer classificação para substituir manualmente.</>
                )}
              </p>

              {/*
               * 3.4.1 — Indicador de impacto pendente + CTA "Recalcular impacto"
               * Regras:
               *   - Só visível quando pendingSimulationSync e não em presentationMode
               *   - Whisper-quiet: banner semântico sem sombra, sem segundo herói
               *   - Alinhado a system.md § Banners semânticos
               */}
              {pendingSimulationSync && !presentationMode && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-300/60 bg-amber-50/50 px-3 py-2 dark:border-amber-700/40 dark:bg-amber-950/20"
                >
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
                    Classificações alteradas — os números acima ainda reflectem a simulação anterior.
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

              <div className="mt-3">
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

            {/* Alertas de crédito */}
            <div className="mt-5">
              <CreditLeakageAlert result={simulation} />
            </div>

            {/* Custo morto / contexto */}
            {leaks.length === 0 ? (
              <div className="mt-4 rounded-lg border border-border/80 bg-muted/20 px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground/90">Custo morto (exemplo ilustrativo)</p>
                <p className="mt-1.5">
                  Uma assinatura de software ou streaming (por exemplo, Netflix) pode ser elegível
                  a crédito quando o serviço estiver ligado à produção da receita tributável — mas
                  se a linha não for enquadrada ou não houver nexo documental na LC 68/2024, o
                  benefício deixa de ser recuperável: vira{" "}
                  <span className="font-medium text-foreground/90">custo morto</span> para efeitos
                  de crédito nesta simulação. O motor não «adivinha» elegibilidade; a tabela abaixo
                  mostra o enquadramento por linha; o detalhe de confiança e nexo RAG está na
                  Cédula (Ver lei).
                </p>
                <p className="mt-2 text-[10px] italic text-muted-foreground/90">
                  Exemplo didáctico, não posição fiscal definitiva — valide com a área fiscal e o
                  perfil real da empresa.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                O exemplo Netflix acima resume a lógica quando não há nexo; com vazamentos
                detectados, priorize as linhas do alerta e a tabela abaixo.
              </p>
            )}

            {/* Tabela de créditos */}
            <div
              id="tribia-journey-creditos"
              className="scroll-mt-28 mt-5 w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm board-ready:shadow-none print:shadow-none"
            >
              <div className="border-b border-border/80 bg-muted/30 px-4 py-3 board-ready:bg-transparent print:bg-transparent">
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
                    className="mt-1 text-xs leading-relaxed text-muted-foreground"
                  >
                    O índice de auditoria acima sintetiza a conformidade global; cada linha abaixo
                    mostra a fundamentação na LC 68/2024.
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground board-ready:hidden">
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
      </div>

      {/* Dialog de memória de cálculo */}
      <Dialog open={memoryOpen} onOpenChange={setMemoryOpen}>
        <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Certificado de memória de cálculo — {focusYear}</DialogTitle>
            <DialogDescription>
              Garantia de auditoria: memória determinística produzida pelo motor Go para o ano de
              foco, reprodutível para confronto externo. Os valores reflectem as premissas do
              modelo TribIA; a IA não altera estes números.
            </DialogDescription>
          </DialogHeader>
          <TransitionAuditPanelBody
            focusYear={focusYear}
            point={point}
            seriesEnriched={seriesEnriched}
            showFactorTooltips
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Sub-componente de cabeçalho de secção ────────────────────────────────────

function SectionHeader({
  id,
  step,
  label,
  boardReadySerif = false,
}: {
  id?: string
  step: number
  label: string
  /** Aplicar font-board-report ao título quando Board-Ready está activo. */
  boardReadySerif?: boolean
}) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden"
      >
        {step}
      </span>
      <h2
        id={id}
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
          boardReadySerif &&
            "board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground",
        )}
      >
        {label}
      </h2>
    </div>
  )
}
