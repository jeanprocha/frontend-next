"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  MoveRight,
} from "lucide-react"
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
  let deltaValue = parseFloat(result.delta)
  const projNet = parseFloat(result.projected.net_tax)
  const currNet = parseFloat(result.current.net_tax)
  if (!Number.isFinite(deltaValue) && Number.isFinite(projNet) && Number.isFinite(currNet)) {
    deltaValue = projNet - currNet
  }
  // delta = projetado − atual (API Go). Negativo = economia; positivo = custo adicional.
  const neutral = !Number.isFinite(deltaValue) || deltaValue === 0
  const saving = deltaValue < 0
  const increase = deltaValue > 0
  const absDelta = Math.abs(deltaValue)
  const absDeltaStr = absDelta.toFixed(2)
  const deltaLabel = neutral
    ? "Sem variação"
    : saving
      ? "Economia projetada"
      : "Aumento de carga"
  const deltaDisplay =
    neutral || !Number.isFinite(absDelta)
      ? formatBRL("0")
      : `${increase ? "+" : saving ? "−" : ""}${formatBRL(absDeltaStr)}`
  const DeltaIcon = neutral ? MoveRight : saving ? ArrowDownRight : ArrowUpRight
  const deltaCardClass = neutral
    ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30"
    : saving
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
      : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
  const deltaTextClass = neutral
    ? "text-slate-700 dark:text-slate-300"
    : saving
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-red-700 dark:text-red-300"

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

  const chartNumericValues = chartData.flatMap((d) => [d.Atual, d.Projetado]).filter(Number.isFinite)
  const yDataMin = chartNumericValues.length ? Math.min(...chartNumericValues) : 0
  const yDataMax = chartNumericValues.length ? Math.max(...chartNumericValues) : 0
  const yFloor = Math.min(0, yDataMin)
  const yCeil = Math.max(0, yDataMax)
  const span = yCeil - yFloor
  const yPad = Math.max(span * 0.08, Math.abs(yCeil) * 0.05, Math.abs(yFloor) * 0.05, 1)

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
        <Card className={deltaCardClass}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <DeltaIcon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {deltaLabel}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground/70 -mt-0.5">
              vs. regime atual
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className={cn("text-2xl font-bold tabular-nums", deltaTextClass)}>
              {deltaDisplay}
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
                domain={[yFloor - yPad, yCeil + yPad]}
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
