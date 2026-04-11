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
  /** Modo controlado (ex.: navegação no cockpit da Sessão 1). */
  esteiraTab?: AuditTabValue
  onEsteiraTabChange?: (tab: AuditTabValue) => void
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
  esteiraTab: controlledTab,
  onEsteiraTabChange,
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
  const expenseCov = computeExpenseEvidenceCoverage(expenses, classifications)
  const avgEvPerLine = avgEvidenceCountAmongLinesWithEvidence(classifications)
  const tenuousLineCount = countTenuousNexusLines(classifications)
  const literalPct =
    breakdown && Number.isFinite(breakdown.llm_confidence_mean)
      ? Math.round(Math.min(1, Math.max(0, breakdown.llm_confidence_mean)) * 100)
      : null

  useEffect(() => {
    if (typeof window === "undefined") return
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
  }, [controlled, onEsteiraTabChange])

  const showCreditsRagLegend = Boolean(aiMetadata)

  const solidityHint =
    score != null && Number.isFinite(score) ? humanSolidityHintFromAggregatedScore01(score) : null

  const revenue = simulation.revenue_total
  const itemCount = services.length + expenses.length

  const leaks = simulation.credit_leaks ?? []

  return (
    <>
    <div
      id="tribia-esteira-de-confianca"
      className="tribia-audit-tabs rounded-xl border border-border/80 bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-card dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] print:border-foreground/20 print:bg-transparent print:shadow-none"
    >
      <p className="border-b border-border/80 px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-emerald-950 dark:text-emerald-100 print:border-foreground/20 print:px-0 print:py-2 print:text-foreground">
        Esteira de confiança
      </p>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as AuditTabValue)}
        className="gap-4"
      >
        <TabsList
          variant="esteira"
          className="grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-2 sm:gap-2 md:grid-cols-4 md:gap-2 print:hidden"
        >
          {AUDIT_TRAIL_STEPS.map((step, i) => {
            const value = TAB_VALUES[i]!
            const showDot = value === "classificacao" && aggregates.hasRedLine
            return (
              <TabsTrigger
                key={value}
                value={value}
                triggerVariant="esteira"
                className={ESTEIRA_TAB_CARD_CLASS}
                aria-label={
                  showDot
                    ? `${step.label} — há linhas com revisão sugerida`
                    : undefined
                }
              >
                <span className="flex w-full min-w-0 items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300/95",
                      "bg-slate-100 font-mono text-[10px] font-semibold tabular-nums text-slate-600",
                      "dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-300",
                      "transition-colors duration-150",
                      "group-data-active/esteira-step:border-emerald-600 group-data-active/esteira-step:bg-emerald-600 group-data-active/esteira-step:text-white",
                      "dark:group-data-active/esteira-step:border-emerald-400 dark:group-data-active/esteira-step:bg-emerald-600",
                    )}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold leading-snug text-foreground">
                      {step.label}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[11px] font-normal leading-snug text-muted-foreground sm:line-clamp-3">
                      {step.detail}
                    </span>
                  </span>
                </span>
                {showDot ? (
                  <span
                    className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500 shadow-sm ring-2 ring-card dark:ring-card"
                    aria-hidden
                  />
                ) : null}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="min-h-[12rem] px-4 pb-4 pt-1 transition-opacity duration-150 print:min-h-0 print:p-0">
          <TabsContent
            value="dados"
            keepMounted
            className="mt-0 rounded-lg border border-transparent p-3 pt-2 outline-none print:block print:border-foreground/15 print:p-2"
          >
            <div id="tribia-journey-dados" className="scroll-mt-24">
              <h3 className="mb-2 hidden text-sm font-semibold print:block">Anatomia do resultado</h3>
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                  presentationMode && "font-board-report text-base font-semibold normal-case text-foreground",
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
                Porquê do número: volume de insumos e comparativo tributário (legado vs destino) antes da prova legal
                nas outras abas.
              </p>
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

              <div id="tribia-anatomia-resumo" className="mt-6 scroll-mt-28">
                <SummaryCards
                  result={summaryResult}
                  compareBaseline={summaryCompareBaseline}
                  overlapAnatomy={summaryOverlapAnatomy}
                  simulationRunYear={summarySimulationRunYear}
                  hideDeltaCard={summaryHideDeltaCard}
                />
              </div>

              {companyContext.trim() ? (
                <div className="mt-4 rounded-lg border border-slate-200/60 bg-white/60 px-3 py-2 dark:border-slate-800/50">
                  <p className="text-[11px] font-medium text-muted-foreground">Contexto da empresa</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{companyContext}</p>
                </div>
              ) : null}
              <div className="mt-6 border-t border-border/80 pt-4">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Cobertura textual da lei sobre os insumos desta simulação — a solidez jurídica consolidada está na tab
                  RAG.
                </p>
                <div className="mt-3">
                  <RagAuditCard
                    aiMetadata={aiMetadata}
                    onOpenBriefing={aiMetadata ? () => openMacroBriefing(aiMetadata) : undefined}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="classificacao"
            keepMounted
            className="mt-0 rounded-lg border border-transparent p-3 outline-none print:block print:border-foreground/15 print:p-2"
          >
            <h3 className="mb-2 hidden text-sm font-semibold print:block">Classificação IA</h3>
            <p className="line-clamp-2 text-xs leading-snug text-foreground">
              <span className="font-semibold uppercase tracking-wide text-[11px] text-muted-foreground">
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
            <div className="mt-4">
              <CreditLeakageAlert result={simulation} />
            </div>
            {leaks.length === 0 ? (
              <div className="mt-4 rounded-lg border border-border/80 bg-muted/20 px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground/90">Custo morto (exemplo ilustrativo)</p>
                <p className="mt-1.5">
                  Uma assinatura de software ou streaming (por exemplo, Netflix) pode ser elegível a crédito quando o
                  serviço estiver ligado à produção da receita tributável — mas se a linha não for enquadrada ou não
                  houver nexo documental na LC 68/2024, o benefício deixa de ser recuperável: vira{" "}
                  <span className="font-medium text-foreground/90">custo morto</span> para efeitos de crédito nesta
                  simulação. O motor não «adivinha» elegibilidade; a tabela abaixo mostra o enquadramento por linha; o
                  detalhe de confiança e nexo RAG está na Cédula (Ver lei).
                </p>
                <p className="mt-2 text-[10px] italic text-muted-foreground/90">
                  Exemplo didáctico, não posição fiscal definitiva — valide com a área fiscal e o perfil real da empresa.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                O exemplo Netflix acima resume a lógica quando não há nexo; com vazamentos detectados, priorize as linhas
                do alerta e a tabela abaixo.
              </p>
            )}
            <div
              id="tribia-journey-creditos"
              className="scroll-mt-24 mt-5 w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm board-ready:shadow-none print:shadow-none"
            >
              <div className="border-b border-border/80 bg-muted/30 px-4 py-3 board-ready:bg-transparent print:bg-transparent">
                <h2
                  className={cn(
                    "text-sm font-semibold",
                    presentationMode && "font-board-report text-base",
                  )}
                >
                  <span className="board-ready:hidden print:hidden">Análise de Créditos — IA</span>
                  <span className="hidden board-ready:inline print:inline">
                    Fundamentação de créditos — LC 68/2024
                  </span>
                </h2>
                {showCreditsRagLegend ? (
                  <p
                    id="tribia-credits-rag-legend"
                    className="mt-1 text-xs leading-relaxed text-muted-foreground"
                  >
                    O índice de auditoria acima sintetiza a conformidade global; cada linha abaixo mostra a
                    fundamentação na LC 68/2024.
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground board-ready:hidden">
                  Borda à esquerda: verde elegível, âmbar atenção (inelegível ou vazamento de crédito), ardósia neutro.
                  &quot;Ver lei&quot; abre a Cédula de auditoria (diagnóstico, evidências e dispositivo legal LC
                  68/2024).
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
          </TabsContent>

          <TabsContent
            value="rag"
            keepMounted
            id="tribia-rag-macro-anchor"
            className="scroll-mt-24 mt-0 rounded-lg border border-transparent p-3 outline-none print:block print:border-foreground/15 print:p-2 data-[inactive]:hidden print:data-[inactive]:block"
          >
            <h3
              className={cn(
                "mb-2 hidden text-sm font-semibold print:block",
                presentationMode && "font-board-report",
              )}
            >
              Veredito de Solidez Jurídica (RAG)
            </h3>
            <h3
              className={cn(
                "text-sm font-semibold text-foreground",
                presentationMode && "font-board-report text-base",
              )}
            >
              Veredito de Solidez Jurídica (RAG)
            </h3>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              O sistema auditou e fundamentou cada linha na LC 68/2024; o motor Go mantém os valores determinísticos.
              Esta aba é a prova legal — certificado de cobertura e escudo de fundamentação — separada dos números da
              anatomia.
            </p>
            {!aiMetadata ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sem metadados de auditoria legislativa nesta simulação. Execute com classificação por IA para ver
                cobertura, certificado e artigo herói.
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
                      O dispositivo da lei que concentra o maior montante em despesas elegíveis nesta simulação — ligação
                      directa entre a base de crédito e o artigo da LC 68/2024. Em Pro, abra o PDF oficial na página
                      indexada para prova perante o fisco.
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
                      <p className="mt-2 text-[11px] text-muted-foreground">Sem artigo indexado para o PDF.</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Sem evidências para o artigo herói — ver a aba Classificação IA.
                  </p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent
            value="go"
            keepMounted
            className="mt-0 rounded-lg border border-transparent p-3 outline-none print:block print:border-foreground/15 print:p-2"
          >
            <h3
              className={cn(
                "mb-2 hidden text-sm font-semibold print:block",
                presentationMode && "font-board-report",
              )}
            >
              Rigor matemático — Motor Go
            </h3>
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

            {transitionUi ? (
              <div
                id="tribia-journey-transicao"
                className="scroll-mt-24 mt-4 space-y-4 print:break-inside-avoid"
              >
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
                    point={transitionUi.chartResult.transition_series?.find((p) => p.year === focusYear)}
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
                <span className="font-medium text-foreground/90">shopspring/decimal</span> em Go — a mesma família de
                precisão decimal esperada em controlo financeiro — evitando erros de arredondamento típicos de{" "}
                <span className="font-mono text-[10px]">float64</span> em pipelines genéricos. Valores monetários e
                alíquotas críticas não passam por ponto flutuante binário na conta central.
              </p>
            </div>

            {simulation.transition_series && simulation.transition_series.length > 0 ? (
              <div className="tribia-surface-work mt-4 px-3 py-3 print:break-inside-avoid">
                <MotorGoTransitionTimeline
                  years={simulation.transition_series.map((p) => p.year)}
                  focusYear={focusYear}
                />
              </div>
            ) : null}

            {showTransitionAuditFactors && point?.delta != null ? (
              <div className="tribia-surface-work mt-3 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Delta entre regimes (motor Go)
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Diferença exacta calculada no destino vs. legado para {focusYear} — não é interpretação da IA.
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

            {showTransitionAuditFactors && point?.factors ? (
              <div className="tribia-surface-work mt-3 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Parâmetros regulamentares de transição ({focusYear})
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Fatores de transição e alíquotas de referência aplicados pelo motor para este ano.
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
                        : formatRegulatoryFactorPair(point.factors.cbs_rate, point.factors.ibs_rate)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                {showTransitionAuditFactors
                  ? "Sem ponto de série para o ano seleccionado."
                  : transitionUi
                    ? "O detalhe completo de fatores por ano está nesta aba, junto ao gráfico de transição, quando o plano inclui fatores de auditoria."
                    : "O detalhe completo de fatores por ano aparece na aba Motor Go quando disponível no seu plano."}
              </p>
            )}

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

            {transitionUi ? (
              <div className="mt-6 min-w-0 print:hidden">
                <SankeyFlowLazy
                  simulation={transitionUi.chartResult}
                  expenses={expenses}
                  services={services}
                />
              </div>
            ) : null}
          </TabsContent>
        </div>
      </Tabs>
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
