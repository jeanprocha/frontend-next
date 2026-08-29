"use client"

import { ExpenseSemanticAuditTable } from "../components/expense-semantic-audit-table"
import { DivergenceTrailPrint } from "../components/divergence-trail-print"
import { ExportAuditCsvButton } from "../components/export-audit-csv-button"
import { aggregateClassifications } from "../lib/classification-aggregates"
import { cn } from "@/lib/utils"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

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
        className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground"
      >
        Mesa de operações
      </h2>
    </div>
  )
}

function MesaRastreabilidadeSection({ record, mode, overrides }: ReportSectionProps) {
  const presentationMode = mode !== "screen-tabs"
  const { classifications, expenses } = record
  const aggregates = aggregateClassifications(classifications)
  const leaks = record.simulation.credit_leaks ?? []

  return (
    <section
      id="tribia-mesa-operacoes"
      aria-labelledby="tribia-section-mesa-title"
      className={cn(
        presentationMode
          ? "scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent"
          : "scroll-mt-36 break-inside-avoid border-0 bg-transparent shadow-none print:bg-transparent",
        "print:mt-6 print:break-before-page print:pt-0",
      )}
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
            {aggregates.meanConfidence != null ? `${Math.round(aggregates.meanConfidence * 100)}%` : "—"}
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
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                presentationMode && "font-board-report text-sm font-semibold normal-case tracking-normal text-foreground",
              )}
            >
              Rastreabilidade por linha
            </p>
            {expenses.length > 0 && (
              <ExportAuditCsvButton expenses={expenses} classifications={classifications} />
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground print:hidden">
            Cada linha mostra a classificação que a IA atribuiu à despesa e o valor que o motor usou no cálculo.
            {!presentationMode && <> Clique em qualquer classificação para substituir manualmente.</>}
          </p>

          {overrides?.pendingSimulationSync && !presentationMode && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "mt-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 print:hidden",
                overrides.recalcErrorMessage
                  ? "border-destructive/30 bg-destructive/8 dark:border-destructive/40"
                  : "border-amber-300/60 bg-amber-50/50 dark:border-amber-700/40 dark:bg-amber-950/20",
              )}
            >
              <p
                className={cn(
                  "text-xs leading-snug",
                  overrides.recalcErrorMessage
                    ? "text-destructive"
                    : "text-amber-800 dark:text-amber-300",
                )}
              >
                {overrides.recalcErrorMessage ? (
                  <>
                    Não foi possível recalcular — {overrides.recalcErrorMessage}
                  </>
                ) : (
                  "Classificações alteradas — os números acima ainda refletem a simulação anterior."
                )}
              </p>
              <button
                type="button"
                onClick={overrides?.onRequestRecalc}
                disabled={overrides?.isRecalculating}
                className={cn(
                  "tribia-touch-target min-h-11 shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  overrides.recalcErrorMessage
                    ? "border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/50"
                    : "border-amber-400/70 bg-amber-100 text-amber-900 hover:bg-amber-200 focus-visible:ring-amber-500 dark:border-amber-600/50 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50",
                )}
              >
                {overrides?.isRecalculating
                  ? "Calculando…"
                  : overrides.recalcErrorMessage
                    ? "Tentar novamente"
                    : "Recalcular impacto"}
              </button>
            </div>
          )}

          <div className="mt-3 print:mt-2">
            <ExpenseSemanticAuditTable
              expenses={expenses}
              classifications={classifications}
              creditLeaks={record.simulation.credit_leaks}
              presentationMode={presentationMode}
              ariaDescribedBy="tribia-semantic-audit-table"
              onApplyOverride={overrides?.onApplyOverride}
              onRemoveOverride={overrides?.onRemoveOverride}
            />
          </div>

          <DivergenceTrailPrint classifications={classifications} />
        </div>

        {leaks.length === 0 ? (
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground print:text-foreground/80">
            Nenhuma despesa desta simulação ficou sem direito a crédito: não há custo morto identificado neste
            cenário.
          </p>
        ) : (
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground print:text-foreground/80">
            As {leaks.length === 1 ? "despesa sem direito a crédito está priorizada" : "despesas sem direito a crédito estão priorizadas"}{" "}
            no Plano de ação, com o valor recuperável de cada uma ao longo da transição.
          </p>
        )}
      </div>
    </section>
  )
}

export const mesaRastreabilidadeSection: ReportSection = {
  id: "mesa-rastreabilidade",
  title: "Mesa de operações — rastreabilidade",
  print: "always",
  screenTab: "mesa",
  Component: MesaRastreabilidadeSection,
}
