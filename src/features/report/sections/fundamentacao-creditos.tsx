"use client"

import { ExpenseTable } from "@/components/tax/expense-table"
import { cn } from "@/lib/utils"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function FundamentacaoCreditosSection({ record, mode }: ReportSectionProps) {
  const presentationMode = mode !== "screen-tabs"
  const { expenses, classifications, aiMetadata } = record
  const showCreditsRagLegend = Boolean(aiMetadata)

  return (
    <div
      id="tribia-journey-creditos"
      className="scroll-mt-28 w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card/50 print:mt-4 print:rounded-md print:border-foreground/20 print:bg-transparent"
    >
      <div className="border-b border-border/60 bg-muted/25 px-4 py-3 print:border-foreground/20 print:bg-transparent">
        <h3 className={cn("text-sm font-semibold", presentationMode && "font-board-report text-base")}>
          <span className="board-ready:hidden print:hidden">Análise de Créditos — IA</span>
          <span className="hidden board-ready:inline print:inline">Fundamentação de créditos — LC 68/2024</span>
        </h3>
        {showCreditsRagLegend ? (
          <p
            id="tribia-credits-rag-legend"
            className="mt-1 text-xs leading-relaxed text-muted-foreground print:text-foreground/85"
          >
            O índice de auditoria acima sintetiza a conformidade global; cada linha abaixo mostra a fundamentação na
            LC 68/2024.
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-muted-foreground board-ready:hidden print:hidden">
          Borda à esquerda: verde elegível, âmbar atenção (inelegível ou vazamento de crédito), ardósia neutro.
          &quot;Ver lei&quot; abre a Cédula de auditoria (diagnóstico, evidências e dispositivo legal LC 68/2024).
        </p>
      </div>
      <ExpenseTable
        expenses={expenses}
        classifications={classifications}
        creditLeaks={record.simulation.credit_leaks}
        presentationMode={presentationMode}
        ariaDescribedBy={showCreditsRagLegend ? "tribia-credits-rag-legend" : undefined}
      />
    </div>
  )
}

export const fundamentacaoCreditosSection: ReportSection = {
  id: "fundamentacao-creditos",
  title: "Fundamentação de créditos",
  print: "always",
  screenTab: "mesa",
  Component: FundamentacaoCreditosSection,
}
