"use client"

import { ExpenseTable } from "@/components/shared/expense-table"
import { DivergenceTrailPrint } from "../components/divergence-trail-print"
import { cn } from "@/lib/utils"
import { useLawCorpus } from "@/lib/use-law-corpus"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function FundamentacaoCreditosSection({ record, mode }: ReportSectionProps) {
  const presentationMode = mode !== "screen-tabs"
  const { expenses, classifications, aiMetadata } = record
  const showCreditsRagLegend = Boolean(aiMetadata)
  const { changelog } = useLawCorpus()

  return (
    <div
      id="tribia-journey-creditos"
      className="scroll-mt-28 w-full min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card/50 print:mt-4 print:rounded-md print:border-foreground/20 print:bg-transparent"
    >
      <div className="border-b border-border/60 bg-muted/25 px-4 py-3 print:border-foreground/20 print:bg-transparent">
        <h3 className={cn("text-sm font-semibold", presentationMode && "font-board-report text-base")}>
          <span className="board-ready:hidden print:hidden">Fundamentação de créditos</span>
          <span className="hidden board-ready:inline print:inline">Fundamentação de créditos — {changelog.label}</span>
        </h3>
        {showCreditsRagLegend ? (
          <p
            id="tribia-credits-rag-legend"
            className="mt-1 text-xs leading-relaxed text-muted-foreground print:text-foreground/85"
          >
            O índice de auditoria acima sintetiza a conformidade global; cada linha abaixo mostra a fundamentação na
            {" "}{changelog.label}.
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-muted-foreground board-ready:hidden print:hidden">
          Borda fina à esquerda acompanha o selo Elegibilidade: verde elegível, âmbar atenção (inelegível ou
          vazamento de crédito), ardósia neutro. Cada linha traz o porquê e a citação da lei; &quot;Ver lei&quot;
          abre o artigo completo (diagnóstico, evidências e dispositivo legal {changelog.label}).
        </p>
      </div>
      <ExpenseTable
        expenses={expenses}
        classifications={classifications}
        creditLeaks={record.simulation.credit_leaks}
        ariaDescribedBy={showCreditsRagLegend ? "tribia-credits-rag-legend" : undefined}
      />
      <div className="px-4 pb-4">
        <DivergenceTrailPrint classifications={classifications} />
      </div>
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
