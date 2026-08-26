"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FinancialVerdictHeroCard } from "@/components/tax/financial-verdict-hero-card"
import { VerdictThesisPanel } from "@/components/tax/verdict-thesis-panel"
import { AuditConfidenceTabs } from "@/components/tax/audit-confidence-tabs"
import { ComparisonVerdictCard } from "@/components/tax/comparison-verdict-card"
import { ExpenseSemanticAuditTable } from "@/components/tax/expense-semantic-audit-table"
import { ExpenseTable } from "@/components/tax/expense-table"
import { TribiaInsights } from "@/components/tax/tribia-insights"
import { Button } from "@/components/ui/button"
import { aggregateClassifications } from "@/lib/classification-aggregates"
import { getPublicSimulationRecord } from "@/lib/api"
import { detailServicesToFormServices, simulationDetailToPersisted } from "@/lib/history-hydrate"
import { simulationAtFocusYear } from "@/lib/transition-focus"
import { cn } from "@/lib/utils"
import type { AuditConfidenceTabsProps } from "@/components/tax/audit-confidence-tabs"
import type { ClassificationHistorySnapshot } from "@/types/api"

const REPORT_PDF_FAB = "report-export-pdf-fab no-print print:hidden"

interface SimulationPublicReportViewProps {
  id: string
}

export function SimulationPublicReportView({ id }: SimulationPublicReportViewProps) {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [raw, setRaw] = useState<Awaited<ReturnType<typeof getPublicSimulationRecord>> | null>(null)
  const [focusYear, setFocusYear] = useState(2026)

  useEffect(() => {
    let c = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- herança FE-0: dívida pré-existente (regra nova do eslint-config-next 16.2.2); resolver ao tocar este arquivo
    setLoading(true)
    setErr(null)
    getPublicSimulationRecord(id)
      .then((d) => {
        if (c) return
        setRaw(d)
        setFocusYear(d.simulation.year)
      })
      .catch((e: unknown) => {
        if (c) return
        setErr(e instanceof Error ? e.message : "Não foi possível carregar o dossié.")
      })
      .finally(() => {
        if (!c) setLoading(false)
      })
    return () => {
      c = true
    }
  }, [id])

  const snapshotBrand = useMemo(() => {
    if (!raw?.classifications_snapshot || typeof raw.classifications_snapshot !== "object")
      return null
    return (raw.classifications_snapshot as ClassificationHistorySnapshot).report_brand
  }, [raw])

  const cardSimulation = useMemo(() => {
    if (!raw) return null
    return simulationAtFocusYear(raw.simulation, focusYear)
  }, [raw, focusYear])

  const esteiraPoint = useMemo(
    () => cardSimulation?.transition_series?.find((p) => p.year === focusYear),
    [cardSimulation, focusYear],
  )

  const { persisted, services, aggregates } = useMemo(() => {
    if (!raw) {
      return {
        persisted: null as ReturnType<typeof simulationDetailToPersisted> | null,
        services: [] as ReturnType<typeof detailServicesToFormServices>,
        aggregates: { meanConfidence: null as number | null, regimeCounts: [] as { key: string; label: string; count: number; pct: number }[], errorCount: 0 },
      }
    }
    const p = simulationDetailToPersisted(raw, {
      createdAt: raw.created_at,
      companyContext: raw.company_context,
      year: raw.year,
      recordId: raw.id,
    })
    return {
      persisted: p,
      services: detailServicesToFormServices(raw.services),
      aggregates: aggregateClassifications(p.classifications),
    }
  }, [raw])

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") window.print()
  }, [])

  const auditProps: Omit<AuditConfidenceTabsProps, "point"> | null = useMemo(() => {
    if (!raw || !cardSimulation || !persisted) return null
    return {
      simulation: cardSimulation,
      services,
      expenses: persisted.expenses,
      classifications: persisted.classifications,
      aiMetadata: persisted.ai_metadata,
      focusYear,
      seriesEnriched: raw.simulation.transition_series_enriched === true,
      presentationMode: true,
      publicLinear: true,
      transitionUi: {
        chartResult: cardSimulation,
        abBaselineResult: undefined,
        transitionFocusYear: true,
        transitionFullChart: (raw.simulation.transition_series?.length ?? 0) > 0,
        transitionAuditFactors: true,
        transitionDynamicInsights: true,
        onFocusYearChange: setFocusYear,
      },
      summaryResult: cardSimulation,
      summaryCompareBaseline: undefined,
      summaryOverlapAnatomy: true,
      summarySimulationRunYear: raw.simulation.year,
      summaryHideDeltaCard: true,
      isRecalculating: false,
      pendingSimulationSync: false,
    }
  }, [raw, cardSimulation, persisted, services, focusYear])

  if (loading) {
    return (
      <div
        className="font-board-report tribia-print-narrative-serif min-h-screen bg-background p-8 text-foreground"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-muted-foreground">A carregar o dossié…</p>
      </div>
    )
  }

  if (err || !raw || !cardSimulation || !persisted || !auditProps) {
    return (
      <div className="font-board-report min-h-screen bg-background p-8">
        <p className="text-destructive text-sm" role="alert">
          {err ?? "Dossié indisponível."}
        </p>
      </div>
    )
  }

  const thesisIsStale =
    persisted.classifications.some((c) => Boolean(c.consultant_override)) &&
    Boolean(raw.simulation.strategy_insight?.trim())
  const leaks = cardSimulation.credit_leaks ?? []
  const sim = cardSimulation
  const sessionCompany = raw.company_context?.trim() || "Contexto de simulação"

  return (
    <div
      className={cn(
        "board-ready font-board-report tribia-print-narrative-serif min-h-screen bg-white text-foreground",
        "print:min-h-0 print:bg-white",
      )}
    >
      <header
        className={cn(
          "print:hidden sticky top-0 z-40 border-b border-border/60 bg-white/95 backdrop-blur",
          "supports-[backdrop-filter]:bg-white/90",
        )}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {snapshotBrand?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={snapshotBrand.logo_url}
                alt={snapshotBrand.org_name || "Logótipo do cliente"}
                className="h-8 w-auto max-w-[140px] object-contain object-left"
              />
            ) : null}
            <div className="min-w-0 text-right sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Auditado via RAG Engine
              </p>
              {snapshotBrand?.org_name ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{snapshotBrand.org_name}</p>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="default"
            className={cn("shrink-0 bg-emerald-700 hover:bg-emerald-800", REPORT_PDF_FAB)}
            data-report-pdf-fab
            onClick={handlePrint}
          >
            Exportar para PDF
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6 print:space-y-6 print:py-4">
        <p className="text-center text-xs text-muted-foreground print:text-foreground/80">
          Relatório linear · referência pública
          {raw.id ? ` · ${raw.id.slice(0, 8)}…` : ""}
        </p>

        {/* 1 — Veredito e parecer */}
        <section
          className="scroll-mt-28 rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6 print:border-foreground/20 print:bg-transparent print:p-0"
          aria-labelledby="public-report-veredito"
        >
          <h1 id="public-report-veredito" className="sr-only">
            Veredito financeiro
          </h1>
          <div
            className={cn(
              "mb-6 grid grid-cols-1 gap-6 print:mb-4 print:grid-cols-1 print:gap-4",
              "md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:items-stretch",
            )}
          >
            <FinancialVerdictHeroCard
              simulation={sim}
              presentationMode
              isRecalculating={false}
              pendingSimulationSync={false}
            />
            <VerdictThesisPanel
              markdown={raw.simulation.strategy_insight}
              scoreRaw={persisted.ai_metadata?.confidence_score}
              evidenceCoverageRaw={
                persisted.ai_metadata?.breakdown?.evidence_coverage != null &&
                Number.isFinite(persisted.ai_metadata!.breakdown!.evidence_coverage)
                  ? persisted.ai_metadata!.breakdown!.evidence_coverage
                  : null
              }
              presentationMode
              pending={false}
              thesisIsStale={thesisIsStale}
              isRecalculating={false}
              pendingSimulationSync={false}
            />
          </div>
          <ComparisonVerdictCard
            mode="single"
            layout="cockpit"
            currentSimulation={sim}
            strategyInsight={raw.simulation.strategy_insight}
            ragSources={persisted.ai_metadata?.sources_analyzed ?? null}
            onEsteiraTabChange={undefined}
            aiMetadata={persisted.ai_metadata}
            classifications={persisted.classifications}
            expenses={persisted.expenses}
            executiveThesisDisplayed={Boolean(raw.simulation.strategy_insight?.trim())}
            insightSlot={
              <TribiaInsights
                result={cardSimulation}
                simulationRunYear={raw.simulation.year}
                omitWhenVereditoCovers={false}
              />
            }
          />
        </section>

        {/* 2 + 3 — Cronograma + Dossiê RAG (linear) */}
        <div className="print:break-inside-avoid">
          <AuditConfidenceTabs
            {...auditProps}
            point={esteiraPoint}
            onEsteiraTabChange={undefined}
          />
        </div>

        {/* 4 — Mesa de operações (leitura) */}
        <section
          className="scroll-mt-28 rounded-xl border border-border/60 bg-card/90 p-5 sm:p-6 print:break-before-page print:border-foreground/20 print:bg-transparent"
          aria-labelledby="public-report-mesa"
        >
          <h2
            id="public-report-mesa"
            className="font-board-report text-lg font-semibold tracking-normal text-foreground"
          >
            Mesa de operações
          </h2>
          <p className="mt-1 text-xs text-muted-foreground print:text-foreground/80">
            {sessionCompany} · {raw.year} · leitura
          </p>
          <p className="mt-3 line-clamp-2 text-xs leading-snug text-foreground">
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
          </p>

          <div id="tribia-semantic-audit-table" className="mt-5 print:mt-4">
            <p className="font-board-report text-sm font-semibold text-foreground">Rastreabilidade por linha</p>
            <div className="mt-3 print:mt-2">
              <ExpenseSemanticAuditTable
                expenses={persisted.expenses}
                classifications={persisted.classifications}
                creditLeaks={cardSimulation.credit_leaks}
                presentationMode
                ariaDescribedBy="tribia-semantic-audit-table"
                onApplyOverride={undefined}
                onRemoveOverride={undefined}
              />
            </div>
          </div>

          {leaks.length === 0 ? (
            <div className="mt-4 rounded-lg border border-border/60 bg-muted/15 px-3 py-3 text-[11px] leading-relaxed text-muted-foreground print:border-foreground/20 print:bg-transparent">
              <p className="font-semibold text-foreground/90">Custo morto (ilustrativo)</p>
              <p className="mt-1.5 print:text-foreground/85">
                O motor não atribui crédito sem enquadramento; a tabela abaixo documenta a posição
                simulada em LC 68/2024.
              </p>
            </div>
          ) : null}

          <div
            className="mt-6 w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card/50 print:rounded-md print:border-foreground/20 print:bg-transparent"
          >
            <div className="border-b border-border/60 bg-muted/25 px-4 py-3 print:border-foreground/20 print:bg-transparent">
              <h3 className="font-board-report text-base font-semibold">Fundamentação de créditos — LC 68/2024</h3>
            </div>
            <ExpenseTable
              expenses={persisted.expenses}
              classifications={persisted.classifications}
              creditLeaks={cardSimulation.credit_leaks}
              presentationMode
            />
          </div>
        </section>
      </div>
    </div>
  )
}
