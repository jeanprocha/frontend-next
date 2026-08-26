"use client"

// Movido de src/app/dashboard/page.tsx (FE-1, move puro) — resumo da
// classificação CSV + tabela de créditos (só existe no modo CSV; em modo
// form a tabela de créditos vive dentro da esteira).
import { motion } from "motion/react"
import { CsvSummary } from "./csv-summary"
import { ExpenseTable } from "@/components/shared/expense-table"
import { cn } from "@/lib/utils"
import { FADE_IN_VARIANTS } from "../lib/motion-variants"
import type { ClassificationItem, FormExpense } from "@/types/api"

export interface DashboardCsvViewProps {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
  boardReadyActive: boolean
  /**
   * Sempre `false` na prática (herdado do original: a checagem comparava
   * `results.mode === "form"` dentro de um bloco só renderizado quando
   * `results.mode === "csv"` — impossível ser true). Preservado bug-for-bug;
   * não corrigido nesta fase de move.
   */
  showCreditsRagLegend: boolean
  shouldReduceMotion: boolean
}

export function DashboardCsvView({
  expenses,
  classifications,
  boardReadyActive,
  showCreditsRagLegend,
  shouldReduceMotion,
}: DashboardCsvViewProps) {
  return (
    <>
      <motion.div
        variants={FADE_IN_VARIANTS}
        initial={shouldReduceMotion ? "visible" : "hidden"}
        animate="visible"
        className="order-5"
      >
        <h2
          className={cn(
            "text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide",
            boardReadyActive && "font-board-report text-lg normal-case text-foreground",
          )}
        >
          Resumo da Classificação — {expenses.length} despesas processadas
        </h2>
        <CsvSummary expenses={expenses} classifications={classifications} />
      </motion.div>

      <motion.div
        variants={FADE_IN_VARIANTS}
        initial={shouldReduceMotion ? "visible" : "hidden"}
        animate="visible"
        id="tribia-journey-creditos"
        className="order-4 scroll-mt-24 overflow-hidden rounded-xl border bg-white shadow-sm board-ready:shadow-none print:shadow-none"
      >
        <div className="border-b bg-muted/30 px-5 py-4 board-ready:bg-transparent print:bg-transparent">
          <h2 className={cn("text-sm font-semibold", boardReadyActive && "font-board-report text-base")}>
            <span className="board-ready:hidden print:hidden">Análise de Créditos — IA</span>
            <span className="hidden board-ready:inline print:inline">
              Fundamentação de créditos — LC 68/2024
            </span>
          </h2>
          {showCreditsRagLegend && (
            <p id="tribia-credits-rag-legend" className="mt-1 text-xs leading-relaxed text-muted-foreground">
              O índice de auditoria acima sintetiza a conformidade global; cada linha abaixo mostra a
              fundamentação na LC 68/2024.
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground board-ready:hidden">
            Borda à esquerda: verde elegível, âmbar atenção (inelegível ou vazamento de crédito), ardósia
            neutro. &quot;Ver lei&quot; abre a Cédula de auditoria (diagnóstico, evidências e dispositivo legal
            LC 68/2024).
          </p>
        </div>
        <ExpenseTable
          expenses={expenses}
          classifications={classifications}
          creditLeaks={undefined}
          presentationMode={boardReadyActive}
          ariaDescribedBy={showCreditsRagLegend ? "tribia-credits-rag-legend" : undefined}
        />
      </motion.div>
    </>
  )
}
