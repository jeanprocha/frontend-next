"use client"

import { useState, type KeyboardEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ExpenseEvidenceColumns } from "@/components/tax/expense-evidence-columns"
import {
  LineBriefingEvidencePanel,
  LineLawEvidencePanel,
} from "@/components/tax/line-evidence-popover-body"
import { formatBRL } from "@/lib/api"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { useTaxStore } from "@/store/useTaxStore"
import { cn } from "@/lib/utils"
import type { ClassificationItem, CreditLeak, FormExpense } from "@/types/api"

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

function expenseInLeakList(leaks: CreditLeak[] | undefined, description: string): boolean {
  if (!leaks?.length) return false
  const d = description.trim()
  return leaks.some((l) => (l.description ?? "").trim() === d)
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
    panel: "ia" | "lei"
  } | null>(null)
  const openBriefing = useTaxStore((s) => s.openAnalystBriefingFromClassification)

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
              <th className="px-4 py-3 text-center font-medium">Regime CBS/IBS</th>
              <th className="px-4 py-3 text-center font-medium">Risco</th>
              <th className="px-4 py-3 text-center font-medium">Confiança</th>
              {!presentationMode && (
                <th
                  className="w-12 px-2 py-3 text-center text-xs font-semibold uppercase tracking-tight text-muted-foreground"
                  title="Detalhes da classificação (toque ou clique no ícone)"
                >
                  IA
                </th>
              )}
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
              const borderAccent = rowLeftBorderClass(
                hasErr,
                Boolean(c),
                Boolean(noRagEvidence),
                Boolean(c?.is_eligible),
                hasLeak,
              )

              return (
                <tr
                  key={row.id}
                  className="group border-b last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td
                    className={cn(
                      "border-l-4 py-3 pl-3 pr-4 font-medium",
                      borderAccent,
                      c && !hasErr && "cursor-pointer hover:underline decoration-dotted underline-offset-4",
                    )}
                    {...(c && !hasErr
                      ? {
                          role: "button" as const,
                          tabIndex: 0,
                          title: "Abrir briefing de auditoria",
                          onClick: () => openBriefing(c),
                          onKeyDown: (e: KeyboardEvent<HTMLTableCellElement>) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              openBriefing(c)
                            }
                          },
                        }
                      : {})}
                  >
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
                    ) : c ? (
                      <Badge variant={c.is_eligible ? "default" : "destructive"}>
                        {c.is_eligible ? "Elegível" : "Não Elegível"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">—</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {hasErr ? (
                      <span className="text-muted-foreground">—</span>
                    ) : c ? (
                      <Badge
                        variant={regimeVariant[c.regime_type] ?? "outline"}
                        className={regimeBadgeClass(c.regime_type)}
                      >
                        {regimeLabel[c.regime_type] ?? "Padrão"}
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
                  <td className="px-4 py-3 text-center text-sm font-semibold tabular-nums text-foreground">
                    {hasErr
                      ? "—"
                      : noRagEvidence
                        ? <span className="text-muted-foreground text-xs font-normal">N/A</span>
                        : c
                          ? `${Math.round(c.confidence * 100)}%`
                          : "—"}
                  </td>
                  {!presentationMode && c && !hasErr ? (
                    <ExpenseEvidenceColumns
                      rowKey={row.id}
                      c={c}
                      touchMeeting={touchMeeting}
                      onTouchOpen={(panel) => setTouchEvidence({ rowKey: row.id, c, panel })}
                    />
                  ) : !presentationMode ? (
                    <>
                      <td className="px-1 py-2 text-center align-middle">
                        <span className="text-muted-foreground/30">—</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasErr ? (
                          <span
                            className="text-xs text-destructive line-clamp-2 max-w-[14rem] ml-auto block text-right"
                            title={errMsg}
                          >
                            {errMsg}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">sem dados</span>
                        )}
                      </td>
                    </>
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
              touchEvidence.panel === "ia" ? (
                <LineBriefingEvidencePanel c={touchEvidence.c} rowKey={touchEvidence.rowKey} />
              ) : (
                <LineLawEvidencePanel c={touchEvidence.c} rowKey={touchEvidence.rowKey} />
              )
            ) : null}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
