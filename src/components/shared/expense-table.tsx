"use client"

import { Fragment, useState } from "react"
import { Info } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ExpenseCedulaDetails } from "./expense-cedula-details"
import { ExpenseEvidenceColumns } from "./expense-evidence-columns"
import {
  ExpenseEligibilityBadge,
  ExpenseRegimeBadge,
  ExpenseRiskBadge,
  ExpenseSignalCell,
  expenseRowAccentBorderClass,
} from "./expense-table-badges"
import { LineUnifiedEvidencePanel } from "./line-evidence-popover-body"
import { formatBRL } from "@/lib/format-money"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { expenseInLeakList } from "@/lib/credit-leak-match"
import { classificationErrorCellText } from "@/lib/classification-error-display"
import { getEffectiveExpenseSimulationFields } from "@/lib/classification-effective"
import { cn } from "@/lib/utils"
import type { ClassificationItem, CreditLeak, FormExpense } from "@/types/api"

/**
 * Cédula de auditoria — a tabela canônica de despesas do documento (dossiê
 * público, board e aba Mesa). Elegibilidade e regime mostram a decisão
 * **efetiva** para o motor (IA ou override) via getEffectiveExpenseSimulationFields
 * — paridade com a ExpenseSemanticAuditTable e o POST de simulação.
 *
 * Cada linha traz o porquê e a citação da lei sempre montados (ExpenseCedulaDetails)
 * — nada fica atrás de hover; ≥ sm/impressão usa uma linha de detalhe na tabela,
 * < sm usa o gêmeo em cartões (mesmo padrão de features/report/sections/plano-de-acao.tsx).
 */
interface ExpenseTableProps {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
  /** Vazamentos ilustrativos da simulação — acento âmbar quando a linha coincide. */
  creditLeaks?: CreditLeak[]
  /** Liga a região da tabela a uma legenda contextual (ex. elo macro RAG no dashboard). */
  ariaDescribedBy?: string
}

export function ExpenseTable({ expenses, classifications, creditLeaks, ariaDescribedBy }: ExpenseTableProps) {
  const touchMeeting = useTouchMeetingMode()
  const [touchEvidence, setTouchEvidence] = useState<{
    rowKey: string
    c: ClassificationItem
  } | null>(null)

  const rows = expenses.map((exp) => {
    const c =
      classifications.find((cl) => cl.client_id === exp.id) ??
      classifications.find((cl) => cl.description === exp.description) ??
      null
    const errMsg = c?.error?.trim()
    const hasErr = Boolean(errMsg)
    const noRagEvidence = Boolean(c && !hasErr && (!c.evidence || c.evidence.length === 0))
    const hasLeak = expenseInLeakList(creditLeaks, exp.description)
    const eff = c && !hasErr ? getEffectiveExpenseSimulationFields(c) : null
    const borderAccent = expenseRowAccentBorderClass(hasErr, Boolean(c), noRagEvidence, Boolean(eff?.is_eligible), hasLeak)
    return { ...exp, c, errMsg, hasErr, eff, borderAccent }
  })

  return (
    <>
      {/* Tabela: telas ≥ sm e impressão. Cada despesa ocupa duas linhas — a
          linha de dados e uma linha de detalhe com porquê + citação, sempre
          montada (nunca atrás de hover). No celular, o gêmeo em cartões
          abaixo assume — valor e classificação sempre visíveis. */}
      <div
        className="hidden overflow-x-auto rounded-md border sm:block print:block print:overflow-visible"
        {...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {})}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Descrição</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-center font-medium">Elegibilidade</th>
              <th className="px-4 py-3 text-center align-middle font-medium">
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span className="leading-none">Regime CBS/IBS</span>
                  <Tooltip>
                    <TooltipTrigger
                      type="button"
                      className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm p-0 leading-none text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="O que é o regime CBS/IBS por linha"
                    >
                      <Info className="size-3.5" aria-hidden />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[min(22rem,calc(100vw-2rem))] text-left text-xs leading-relaxed">
                      <p>
                        O valor por linha vem da classificação (Art. 131 da legislação vigente):{" "}
                        <span className="font-medium text-background">Padrão</span>,{" "}
                        <span className="font-medium text-background">Reduzido 60%</span> ou{" "}
                        <span className="font-medium text-background">Alíquota Zero</span>. Só aparecem os dois últimos
                        quando a IA e os trechos da lei recuperados sustentam — por exemplo, com regime da empresa
                        «Diferenciado 60%» ou «Cesta básica / alíquota zero» e despesas coerentes com esse perfil.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </span>
              </th>
              <th className="px-4 py-3 text-center font-medium">Risco</th>
              <th className="px-4 py-3 text-center font-medium">Sinal</th>
              <th className="px-4 py-3 text-right font-medium">Base Legal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { c, errMsg, hasErr, eff, borderAccent } = row
              return (
                <Fragment key={row.id}>
                  <tr className="group border-b-0 transition-colors hover:bg-muted/30">
                    <td className={cn("border-l py-3 pl-3 pr-4 font-medium", borderAccent)}>{row.description}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-foreground">
                      {formatBRL(row.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ExpenseEligibilityBadge hasErr={hasErr} errMsg={errMsg} c={c} eff={eff} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ExpenseRegimeBadge hasErr={hasErr} c={c} eff={eff} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ExpenseRiskBadge hasErr={hasErr} c={c} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ExpenseSignalCell hasErr={hasErr} c={c} />
                    </td>
                    {c && !hasErr ? (
                      <ExpenseEvidenceColumns
                        rowKey={row.id}
                        c={c}
                        touchMeeting={touchMeeting}
                        onTouchOpen={() => setTouchEvidence({ rowKey: row.id, c })}
                      />
                    ) : (
                      <td className="px-4 py-3 text-right">
                        {hasErr ? (
                          <span
                            className="ml-auto line-clamp-3 block max-w-[min(18rem,100%)] text-right text-xs text-destructive"
                            title={errMsg}
                          >
                            {classificationErrorCellText(errMsg ?? "")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">sem dados</span>
                        )}
                      </td>
                    )}
                  </tr>
                  <tr className="border-b bg-muted/10 last:border-0 print:bg-transparent">
                    <td colSpan={7} className={cn("border-l px-4 pt-0 pb-3", borderAccent)}>
                      <ExpenseCedulaDetails classification={c} />
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Gêmeo mobile: um cartão por despesa, valor sempre na tela — mesmo
          padrão de features/report/sections/plano-de-acao.tsx. */}
      <ul className="flex list-none flex-col gap-2.5 p-0 sm:hidden print:hidden">
        {rows.map((row) => {
          const { c, errMsg, hasErr, eff, borderAccent } = row
          return (
            <li key={row.id} className={cn("rounded-lg border border-l bg-card p-3", borderAccent)}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 flex-1 font-medium text-foreground">{row.description}</p>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {formatBRL(row.amount)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ExpenseEligibilityBadge hasErr={hasErr} errMsg={errMsg} c={c} eff={eff} />
                <ExpenseRegimeBadge hasErr={hasErr} c={c} eff={eff} />
                <ExpenseRiskBadge hasErr={hasErr} c={c} />
                <ExpenseSignalCell hasErr={hasErr} c={c} />
              </div>
              <ExpenseCedulaDetails classification={c} className="mt-2.5" />
            </li>
          )
        })}
      </ul>

      {touchMeeting && (
        <Sheet
          open={touchEvidence !== null}
          onOpenChange={(open) => {
            if (!open) setTouchEvidence(null)
          }}
        >
          <SheetContent
            side="bottom"
            className="flex max-h-[min(88vh,600px)] flex-col gap-0 overflow-hidden rounded-t-2xl p-0"
            showCloseButton
          >
            {touchEvidence ? (
              <LineUnifiedEvidencePanel c={touchEvidence.c} rowKey={touchEvidence.rowKey} />
            ) : null}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
