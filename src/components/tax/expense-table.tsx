"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ExpenseEvidenceColumns } from "@/components/tax/expense-evidence-columns"
import { LineUnifiedEvidencePanel } from "@/components/tax/line-evidence-popover-body"
import { formatBRL } from "@/lib/api"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { expenseInLeakList } from "@/lib/credit-leak-match"
import { classificationErrorCellText } from "@/lib/classification-error-display"
import { getEffectiveExpenseSimulationFields } from "@/lib/classification-effective"
import { cn } from "@/lib/utils"
import type { ClassificationItem, CreditLeak, FormExpense } from "@/types/api"

/**
 * Tabela de créditos. Elegibilidade e regime mostram a decisão **efectiva** para o
 * motor (IA ou override) via getEffectiveExpenseSimulationFields — paridade com
 * a ExpenseSemanticAuditTable e o POST de simulação.
 */
interface ExpenseTableProps {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
  /** Vazamentos ilustrativos da simulação — borda âmbar quando a linha coincide. */
  creditLeaks?: CreditLeak[]
  /** Oculta coluna Base Legal / Ver lei (modo apresentação ou impressão). */
  presentationMode?: boolean
  /** Liga a região da tabela a uma legenda contextual (ex. elo macro RAG no dashboard). */
  ariaDescribedBy?: string
}

const riskVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  baixo: "default",
  medio: "secondary",
  alto: "destructive",
}

const regimeLabel: Record<string, string> = {
  diferenciado_60: "Reduzido 60%",
  reduzido_zero: "Alíquota Zero",
  padrao: "Padrão",
}

const regimeVariant: Record<string, "default" | "secondary" | "outline"> = {
  diferenciado_60: "secondary",
  reduzido_zero: "default",
  padrao: "outline",
}


function regimeBadgeClass(regimeType: string): string {
  const v = regimeVariant[regimeType] ?? "outline"
  if (v === "outline" || v === "secondary") return "font-normal text-muted-foreground"
  return "font-normal"
}

function riskBadgeClass(riskLevel: string): string {
  const v = riskVariant[riskLevel] ?? "outline"
  if (v === "outline" || v === "secondary") return "font-normal text-muted-foreground"
  return "font-normal"
}

function rowLeftBorderClass(
  hasErr: boolean,
  hasClassification: boolean,
  noRagEvidence: boolean,
  isEligible: boolean,
  hasLeak: boolean,
): string {
  if (hasErr || !hasClassification) {
    return "border-l-slate-400/85 dark:border-l-slate-500"
  }
  if (noRagEvidence) {
    return "border-l-slate-400/85 dark:border-l-slate-500"
  }
  if (isEligible && !hasLeak) {
    return "border-l-emerald-500 dark:border-l-emerald-400"
  }
  return "border-l-amber-500 dark:border-l-amber-400"
}

export function ExpenseTable({
  expenses,
  classifications,
  creditLeaks,
  presentationMode = false,
  ariaDescribedBy,
}: ExpenseTableProps) {
  const touchMeeting = useTouchMeetingMode()
  const [touchEvidence, setTouchEvidence] = useState<{
    rowKey: string
    c: ClassificationItem
  } | null>(null)

  const rows = expenses.map((exp) => ({
    ...exp,
    classification:
      classifications.find((c) => c.client_id === exp.id) ??
      classifications.find((c) => c.description === exp.description) ??
      null,
  }))

  return (
    <>
      <div
        className="rounded-md border overflow-x-auto"
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
                        O valor por linha vem da classificação (LC 68/2024, Art. 131):{" "}
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
              {!presentationMode && (
                <th className="px-4 py-3 text-right font-medium">Base Legal</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const c = row.classification
              const errMsg = c?.error?.trim()
              const hasErr = Boolean(errMsg)
              const noRagEvidence = c && !hasErr && (!c.evidence || c.evidence.length === 0)
              const hasLeak = expenseInLeakList(creditLeaks, row.description)
              const eff = c && !hasErr ? getEffectiveExpenseSimulationFields(c) : null
              const borderAccent = rowLeftBorderClass(
                hasErr,
                Boolean(c),
                Boolean(noRagEvidence),
                Boolean(eff?.is_eligible),
                hasLeak,
              )

              return (
                <tr
                  key={row.id}
                  className="group border-b last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className={cn("border-l-4 py-3 pl-3 pr-4 font-medium", borderAccent)}>
                    {row.description}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-foreground">
                    {formatBRL(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasErr ? (
                      <Badge variant="outline" title={errMsg}>
                        Erro na classificação
                      </Badge>
                    ) : c && eff ? (
                      <Badge variant={eff.is_eligible ? "default" : "destructive"}>
                        {eff.is_eligible ? "Elegível" : "Não Elegível"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">—</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasErr ? (
                      <span className="text-muted-foreground">—</span>
                    ) : c && eff ? (
                      <Badge
                        variant={regimeVariant[eff.regime_type] ?? "outline"}
                        className={regimeBadgeClass(eff.regime_type)}
                      >
                        {regimeLabel[eff.regime_type] ?? "Padrão"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasErr ? (
                      <span className="text-muted-foreground">—</span>
                    ) : c ? (
                      <Badge
                        variant={riskVariant[c.risk_level] ?? "outline"}
                        className={riskBadgeClass(c.risk_level)}
                      >
                        {c.risk_level}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {!presentationMode && c && !hasErr ? (
                    <ExpenseEvidenceColumns
                      rowKey={row.id}
                      c={c}
                      touchMeeting={touchMeeting}
                      onTouchOpen={() => setTouchEvidence({ rowKey: row.id, c })}
                    />
                  ) : !presentationMode ? (
                    <td className="px-4 py-3 text-right">
                      {hasErr ? (
                        <span
                          className="text-xs text-destructive line-clamp-3 max-w-[min(18rem,100%)] ml-auto block text-right"
                          title={errMsg}
                        >
                          {classificationErrorCellText(errMsg ?? "")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">sem dados</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {touchMeeting && (
        <Sheet
          open={!presentationMode && touchEvidence !== null}
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
