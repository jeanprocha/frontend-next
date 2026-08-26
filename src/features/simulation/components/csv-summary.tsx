import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL } from "@/lib/format-money"
import type { ClassificationItem, FormExpense } from "@/types/api"

interface CsvSummaryProps {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
}

export function CsvSummary({ expenses, classifications }: CsvSummaryProps) {
  // Constrói mapa description → classification para lookup O(1)
  const classMap = new Map(classifications.map((c) => [c.description, c]))

  let totalAmount = 0
  let eligibleAmount = 0
  let eligibleCount = 0
  let ineligibleCount = 0

  for (const exp of expenses) {
    const amount = parseFloat(exp.amount) || 0
    totalAmount += amount

    const c = classMap.get(exp.description)
    if (c?.is_eligible) {
      eligibleAmount += amount
      eligibleCount++
    } else {
      ineligibleCount++
    }
  }

  const creditPct = totalAmount > 0 ? (eligibleAmount / totalAmount) * 100 : 0

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total analisado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{expenses.length}</p>
          <p className="text-xs text-muted-foreground">despesas</p>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Elegíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {eligibleCount}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">
            {formatBRL(eligibleAmount.toFixed(2))} em créditos
          </p>
        </CardContent>
      </Card>

      <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">
            Não elegíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-rose-700 dark:text-rose-400">
            {ineligibleCount}
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-500">
            sem aproveitamento de crédito
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Aproveitamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{creditPct.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">
            do valor total é elegível
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
