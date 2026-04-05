"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EvidenceDrawer } from "./evidence-drawer"
import { formatBRL } from "@/lib/api"
import type { ClassificationItem, FormExpense } from "@/types/api"

interface ExpenseTableProps {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
}

const riskVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  baixo: "default",
  medio: "secondary",
  alto: "destructive",
}

// Mapeamento visual dos regimes tributários (Art. 131 LC 68/2024).
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

export function ExpenseTable({ expenses, classifications }: ExpenseTableProps) {
  const [selected, setSelected] = useState<ClassificationItem | null>(null)

  const rows = expenses.map((exp) => ({
    ...exp,
    classification: classifications.find((c) => c.description === exp.description) ?? null,
  }))

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Descrição</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-center font-medium">Elegibilidade</th>
              <th className="px-4 py-3 text-center font-medium">Regime CBS/IBS</th>
              <th className="px-4 py-3 text-center font-medium">Risco</th>
              <th className="px-4 py-3 text-center font-medium">Confiança</th>
              <th className="px-4 py-3 text-right font-medium">Base Legal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const c = row.classification
              const errMsg = c?.error?.trim()
              const hasErr = Boolean(errMsg)
              const noRagEvidence =
                c && !hasErr && (!c.evidence || c.evidence.length === 0)
              return (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{row.description}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
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
                      <Badge variant={regimeVariant[c.regime_type] ?? "outline"}>
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
                      <Badge variant={riskVariant[c.risk_level] ?? "outline"}>
                        {c.risk_level}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                    {hasErr
                      ? "—"
                      : noRagEvidence
                        ? "N/A"
                        : c
                          ? `${Math.round(c.confidence * 100)}%`
                          : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {hasErr ? (
                      <span
                        className="text-xs text-destructive line-clamp-2 max-w-[14rem] ml-auto block text-right"
                        title={errMsg}
                      >
                        {errMsg}
                      </span>
                    ) : c ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary h-auto py-1 px-2"
                        onClick={() => setSelected(c)}
                      >
                        Ver lei
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">sem dados</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <EvidenceDrawer
        item={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
