"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatBRL, formatPct } from "@/lib/api"
import type { SimulationResponse } from "@/types/api"

interface SummaryCardsProps {
  result: SimulationResponse
}

// Tooltip customizado para exibir valores em BRL
function BrlTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {formatBRL(String(p.value))}
        </p>
      ))}
    </div>
  )
}

export function SummaryCards({ result }: SummaryCardsProps) {
  const deltaNum = parseFloat(result.delta)
  // delta = currentNet - projectedNet; positivo = atual mais caro = economia com o novo regime.
  const saving = deltaNum > 0
  const deltaLabel = saving ? "Economia estimada" : "Custo adicional"
  const deltaColor = saving ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"

  // Dataset para o BarChart
  const chartData = [
    {
      name: "Bruto",
      Atual: parseFloat(result.current.gross_tax),
      Projetado: parseFloat(result.projected.gross_tax),
    },
    {
      name: "Créditos",
      Atual: parseFloat(result.current.credits),
      Projetado: parseFloat(result.projected.credits),
    },
    {
      name: "Líquido",
      Atual: parseFloat(result.current.net_tax),
      Projetado: parseFloat(result.projected.net_tax),
    },
  ]

  return (
    <div className="space-y-4">
      {/* ── Três cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Regime atual */}
        <Card className="border-l-4 border-l-muted-foreground/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Regime Atual
            </CardTitle>
            <p className="text-[11px] text-muted-foreground/70 -mt-0.5">PIS/COFINS + ISS</p>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold tabular-nums">
              {formatBRL(result.current.net_tax)}
            </p>
            <p className="text-xs text-muted-foreground">
              Bruto {formatBRL(result.current.gross_tax)}
              <span className="mx-1 opacity-40">·</span>
              Créditos {formatBRL(result.current.credits)}
            </p>
          </CardContent>
        </Card>

        {/* Projetado */}
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projetado {result.year}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground/70 -mt-0.5">CBS · IBS</p>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold tabular-nums text-accent">
              {formatBRL(result.projected.net_tax)}
            </p>
            <p className="text-xs text-muted-foreground">
              Bruto {formatBRL(result.projected.gross_tax)}
              <span className="mx-1 opacity-40">·</span>
              Créditos {formatBRL(result.projected.credits)}
            </p>
          </CardContent>
        </Card>

        {/* Delta */}
        <Card
          className={cn(
            "border-l-4",
            saving ? "border-l-emerald-500" : "border-l-rose-500",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {deltaLabel}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground/70 -mt-0.5">
              vs. regime atual
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className={cn("text-2xl font-bold tabular-nums", deltaColor)}>
              {formatBRL(result.delta)}
            </p>
            <p className="text-xs text-muted-foreground">
              Variação de {formatPct(result.delta_pct)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Gráfico comparativo ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Comparativo visual — Atual vs. {result.year}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={chartData}
              barCategoryGap="30%"
              barGap={4}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`
                }
                width={36}
              />
              <Tooltip content={<BrlTooltip />} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              <Bar
                dataKey="Atual"
                fill="var(--color-chart-2)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="Projetado"
                fill="var(--color-chart-1)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
