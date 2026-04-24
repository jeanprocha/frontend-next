"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useState } from "react"
import { AUDIT_TRAIL_STEPS } from "@/components/tax/audit-trail-journey"
import { BoardAuditCertificate } from "@/components/tax/board-audit-certificate"
import { BoardLegalCoverageShield } from "@/components/tax/board-legal-coverage-shield"
import { CreditLeakageAlert } from "@/components/tax/credit-leakage-alert"
import { ExpenseTable } from "@/components/tax/expense-table"
import { RagAuditCard } from "@/components/tax/rag-audit-card"
import { SummaryCards } from "@/components/tax/summary-cards"
import { LawPdfAuthorityCard } from "@/components/tax/law-pdf-authority-card"
import { TransitionAuditPanel } from "@/components/tax/transition-audit-panel"
import { TransitionAuditPanelBody } from "@/components/tax/transition-audit-panel-body"
import { TransitionGoPeaksMarcos } from "@/components/tax/transition-go-peaks-marcos"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatBRL } from "@/lib/api"
import {
  formatRegulatoryFactorDisplay,
  formatRegulatoryFactorPair,
} from "@/lib/format-regulatory-factor"
import { parseApiDecimal } from "@/lib/money-decimal"
import { factorTransitionAuditTooltip } from "@/lib/transition-audit-copy"
import { aggregateClassifications } from "@/lib/classification-aggregates"
import { confidenceTierFromScore01, humanSolidityHintFromAggregatedScore01 } from "@/lib/confidence-tiers"
import {
  avgEvidenceCountAmongLinesWithEvidence,
  countTenuousNexusLines,
} from "@/lib/rag-tab-stats"
import { resolveHeroEvidencePick } from "@/lib/session-authority-evidence"
import type { TransitionEsteiraUi } from "@/lib/transition-esteira-ui"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import type {
  AiMetadata,
  ClassificationItem,
  SimulationResponse,
  TransitionSeriesPoint,
} from "@/types/api"

const TAB_VALUES = ["dados", "classificacao", "rag", "go"] as const
export type AuditTabValue = (typeof TAB_VALUES)[number]
/** Valores das tabs da esteira (sincronizar com `AUDIT_TRAIL_STEPS`). */
export const AUDIT_TAB_VALUES = TAB_VALUES

function ChartSankeySkeleton() {
  return <Skeleton className="h-[min(360px,50vh)] w-full min-h-[200px] rounded-xl" />
}

const TransitionChartLazy = dynamic(
  () => import("@/components/tax/transition-chart").then((m) => m.TransitionChart),
  { ssr: false, loading: () => <ChartSankeySkeleton /> },
)

const SankeyFlowLazy = dynamic(
  () => import("@/components/tax/sankey-flow").then((m) => m.SankeyFlow),
  { ssr: false, loading: () => <ChartSankeySkeleton /> },
)

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
        O ano de foco posiciona-se na rampa de convivência entre regimes; os valores desta aba são reprodutíveis para
        esse ano e auditáveis externamente.
      </p>
    </div>
  )
}

/**
 * Esteira alinhada a `.interface-design/system.md` e `audit-trail-journey`:
 * borda tokenizada, acento esmeralda no passo activo, sombra suave só no estado seleccionado.
 */
const ESTEIRA_TAB_CARD_CLASS =
  "group/esteira-step relative z-0 min-h-0 w-full rounded-lg border border-slate-300/95 bg-card px-3 py-2.5 " +
  "shadow-[0_4px_14px_rgb(0,0,0,0.04)] " +
  "dark:border-slate-600 dark:bg-card/50 dark:shadow-[0_8px_24px_rgb(0,0,0,0.18)] " +
  "transition-[border-color,box-shadow,background-color,z-index] duration-200 ease-out " +
  "hover:border-slate-400 hover:bg-muted/30 dark:hover:border-slate-500 dark:hover:bg-muted/30 " +
  "data-active:z-[1] data-active:border-emerald-500 data-active:bg-emerald-50/98 data-active:shadow-[0_10px_36px_rgb(16,185,129,0.12)] data-active:ring-2 data-active:ring-emerald-500/30 " +
  "dark:data-active:border-emerald-400 dark:data-active:bg-emerald-950/50 dark:data-active:shadow-[0_10px_36px_rgb(0,0,0,0.32)] dark:data-active:ring-emerald-400/35 " +
  "print:z-0 print:shadow-none print:ring-0"

import type { SimulationEsteiraProps } from "@/components/tax/simulation-esteira-types"

export interface AuditConfidenceTabsProps {
  simulation: SimulationResponse
  services: { id: string; description: string; amount: string }[]
  expenses: { id: string; description: string; amount: string }[]
  companyContext: string
  classifications: ClassificationItem[]
  aiMetadata: AiMetadata | null | undefined
  focusYear: number
  point: TransitionSeriesPoint | undefined
  seriesEnriched?: boolean
  showTransitionAuditFactors: boolean
  /** Modo apresentação / Board-Ready — alinha com `ExpenseTable` (colunas legais). */
  presentationMode?: boolean
  /** Gráfico de transição, Sankey e picos — Tab Motor Go. */
  transitionUi?: TransitionEsteiraUi
  /** Tab «Anatomia»: comparativo tributário (legado vs destino, gráfico). */
  summaryResult: SimulationResponse
  summaryCompareBaseline?: SimulationResponse
  summaryOverlapAnatomy: boolean
  summarySimulationRunYear?: number
  /** Quando o delta já está no Hero, suprimir o cartão de delta aqui. */
  summaryHideDeltaCard: boolean
  isRecalculating?: boolean
  pendingSimulationSync?: boolean
  /** Modo controlado (ex.: navegação no cockpit da Sessão 1). */
  esteiraTab?: AuditTabValue
  onEsteiraTabChange?: (tab: AuditTabValue) => void
  /**
   * Dossié público linear: em sequência Cronograma (go) e RAG, sem bloco Anatomia nem tabs.
   */
  publicLinear?: boolean
}

export function AuditConfidenceTabs({
  simulation,
  services,
  expenses,
  companyContext,
  classifications,
  aiMetadata,
  focusYear,
  point,
  seriesEnriched,
  showTransitionAuditFactors,
  presentationMode = false,
  transitionUi,
  summaryResult,
  summaryCompareBaseline,
  summaryOverlapAnatomy,
  summarySimulationRunYear,
  summaryHideDeltaCard,
  isRecalculating = false,
  pendingSimulationSync = false,
  esteiraTab: controlledTab,
  onEsteiraTabChange,
  publicLinear = false,
}: AuditConfidenceTabsProps) {
  const [internalTab, setInternalTab] = useState<AuditTabValue>("dados")
  const controlled = typeof onEsteiraTabChange === "function"
  const tab = controlled ? (controlledTab ?? "dados") : internalTab
  const setTab = useCallback(
    (v: AuditTabValue) => {
      if (controlled) {
        onEsteiraTabChange(v)
      } else {
        setInternalTab(v)
      }
    },
    [controlled, onEsteiraTabChange],
  )
  const [memoryOpen, setMemoryOpen] = useState(false)
  const openMacroBriefing = useTaxStore((s) => s.openAnalystBriefingFromMacro)

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
  const avgEvPerLine = avgEvidenceCountAmongLinesWithEvidence(classifications)
  const tenuousLineCount = countTenuousNexusLines(classifications)
  const literalPct =
    breakdown && Number.isFinite(breakdown.llm_confidence_mean)
      ? Math.round(Math.min(1, Math.max(0, breakdown.llm_confidence_mean)) * 100)
      : null
  const solidityHint =
    score != null && Number.isFinite(score) ? humanSolidityHintFromAggregatedScore01(score) : null
  const withEvidenceCount = breakdown?.with_evidence_count ?? 0
  const classifiedCount = breakdown?.classified_count ?? classifications.length

  useEffect(() => {
    if (publicLinear || typeof window === "undefined") return
    const applyHash = () => {
      const h = window.location.hash
      let next: AuditTabValue | null = null
      if (h === "#tribia-rag-macro-anchor") next = "rag"
      if (h === "#tribia-journey-creditos") next = "classificacao"
      if (h === "#tribia-journey-dados" || h === "#tribia-anatomia-resumo") next = "dados"
      if (next === null) return
      if (controlled) {
        onEsteiraTabChange?.(next)
      } else {
        setInternalTab(next)
      }
    }
    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [controlled, onEsteiraTabChange, publicLinear])

  return (
    <>
      <div id="tribia-esteira-de-confianca" className="space-y-8 print:space-y-6">
        
        {/* ANATOMIA (Ex-Dados) */}
        {(!publicLinear && (presentationMode || tab === "dados")) && (
        <section id="tribia-journey-dados" className="scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent">
          <div className="p-5 sm:p-6 print:p-0">
            <div className="mb-4 flex items-center gap-2.5 print:mb-3">
              <h2
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                  "board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground",
                )}
              >
                Anatomia do resultado
              </h2>
            </div>
            <SummaryCards
              result={summaryResult}
              compareBaseline={summaryCompareBaseline}
              overlapAnatomy={summaryOverlapAnatomy}
              simulationRunYear={summarySimulationRunYear}
              hideDeltaCard={summaryHideDeltaCard}
            />
          </div>
        </section>
        )}

        {/* CRONOGRAMA DE IMPACTO */}
        {(publicLinear || presentationMode || tab === "go") && (
        <section id="tribia-journey-transicao" className="scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent">
          <div className="p-5 sm:p-6 print:p-0">
            <div className="mb-4 flex items-center gap-2.5 print:mb-3">
              <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden">
                2
              </span>
              <h2 className={cn(
                "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                "board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground"
              )}>
                Cronograma de Impacto (Motor Go)
              </h2>
            </div>
            {simulation.transition_series && simulation.transition_series.length > 0 && (
              <div className="mb-5">
                <MotorGoTransitionTimeline
                  years={simulation.transition_series.map((p) => p.year)}
                  focusYear={focusYear}
                />
              </div>
            )}
            {transitionUi && (
              <div className="mb-5">
                <TransitionChartLazy
                  result={transitionUi.chartResult}
                  abBaselineResult={transitionUi.abBaselineResult}
                  chartMode={transitionUi.transitionFullChart ? "full" : "sparkline"}
                  focusYear={focusYear}
                  onFocusYearChange={transitionUi.onFocusYearChange}
                  presentationMode={presentationMode}
                  isRecalculating={isRecalculating}
                  pendingSimulationSync={pendingSimulationSync}
                />
              </div>
            )}
            {simulation.transition_series && simulation.transition_series.length > 0 && (
              <div className="mb-5">
                <TransitionGoPeaksMarcos
                  series={simulation.transition_series}
                  focusYear={focusYear}
                />
              </div>
            )}
            {transitionUi?.transitionFullChart && (
              <div className="mb-5">
                <SankeyFlowLazy
                  simulation={simulation}
                  expenses={expenses}
                  services={services}
                />
              </div>
            )}
            <div className="mb-5">
              <TransitionAuditPanel
                focusYear={focusYear}
                point={point}
                seriesEnriched={seriesEnriched}
              />
            </div>
            <CreditLeakageAlert result={simulation} />
          </div>
        </section>
        )}

        {/* DOSSIÊ RAG */}
        {(publicLinear || presentationMode || tab === "rag") && (
        <section id="tribia-dossie-auditoria" className="scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent">
          <div className="p-5 sm:p-6 print:p-0">
            <div className="mb-4 flex items-center gap-2.5 print:mb-3">
              <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden">
                3
              </span>
              <h2 className={cn(
                "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
                "board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground"
              )}>
                Dossiê de Auditoria (RAG)
              </h2>
            </div>
            <div className="space-y-5">
              {tier != null && (
                <BoardLegalCoverageShield
                  coveragePct={coveragePct}
                  withEvidence={withEvidenceCount}
                  total={Math.max(1, classifiedCount)}
                  tier={tier}
                  score={score}
                  solidityHint={solidityHint}
                />
              )}
              <RagAuditCard
                aiMetadata={aiMetadata}
                onOpenBriefing={
                  aiMetadata
                    ? () => {
                        openMacroBriefing(aiMetadata)
                      }
                    : undefined
                }
              />
              <BoardAuditCertificate
                literalPct={literalPct}
                avgEvPerLine={avgEvPerLine}
                tenuousLineCount={tenuousLineCount}
              />
              {heroPick?.evidence.article_id ? (
                <LawPdfAuthorityCard
                  chunkArticleId={heroPick.evidence.article_id}
                  className="print:border-foreground/20"
                />
              ) : null}
            </div>
          </div>
        </section>
        )}

      </div>
      <Dialog open={memoryOpen} onOpenChange={setMemoryOpen}>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Certificado de memória de cálculo — {focusYear}</DialogTitle>
          <DialogDescription>
            Garantia de auditoria: memória determinística produzida pelo motor Go para o ano de foco, reprodutível para
            confronto externo. Os valores reflectem as premissas do modelo TribIA; a IA não altera estes números.
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
