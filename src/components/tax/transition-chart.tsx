"use client"

import { useMemo, useState } from "react"
import { BadgeCheck } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/api"
import type { SimulationResponse } from "@/types/api"

const OLD_COLOR = "#64748b"
const NEW_COLOR = "#10b981"
const MIN_YEAR = 2026
const MAX_YEAR = 2033

type DisplayMode = "brl" | "pct"

interface ChartRow {
  year: number
  legado: number
  novo: number
  inflection: boolean
}

function parseMoney(s: string): number {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function buildRows(
  series: NonNullable<SimulationResponse["transition_series"]>,
  mode: DisplayMode,
  revenue: number,
): ChartRow[] {
  let inflectionYear: number | null = null
  for (const p of series) {
    const oldN = parseMoney(p.old_tax_net)
    const newN = parseMoney(p.new_tax_net)
    if (newN < oldN) {
      inflectionYear = p.year
      break
    }
  }

  return series.map((p) => {
    let legado = parseMoney(p.old_tax_net)
    let novo = parseMoney(p.new_tax_net)
    if (mode === "pct" && revenue > 0) {
      legado = (legado / revenue) * 100
      novo = (novo / revenue) * 100
    }
    return {
      year: p.year,
      legado,
      novo,
      inflection: inflectionYear !== null && p.year === inflectionYear,
    }
  })
}

function TransitionTooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    color?: string
    dataKey?: string
    payload?: ChartRow
  }>
  label?: string | number
  mode: DisplayMode
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  const fmt = (v: number) =>
    mode === "brl" ? formatBRL(v.toFixed(2)) : `${v.toFixed(2)}% da receita`
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md max-w-xs">
      <p className="font-semibold mb-1.5 flex items-center gap-1.5">
        Ano {label}
        {row?.inflection && (
          <BadgeCheck className="size-3.5 text-emerald-600 shrink-0" aria-label="Primeiro ano em que o projetado fica abaixo do legado" />
        )}
      </p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-muted-foreground" style={{ color: p.color }}>
          {p.name}: {fmt(Number(p.value))}
        </p>
      ))}
      {row && (
        <p className="mt-1.5 pt-1.5 border-t text-[10px] text-muted-foreground leading-snug">
          Legado: PIS/COFINS/ISS (modelo atual). Novo: CBS/IBS (projetado). Valores ilustrativos (TribIA).
        </p>
      )}
    </div>
  )
}

interface TransitionChartProps {
  result: SimulationResponse
}

export function TransitionChart({ result }: TransitionChartProps) {
  const series = result.transition_series
  const [mode, setMode] = useState<DisplayMode>("brl")

  const revenue = useMemo(() => {
    const r = parseFloat(result.revenue_total ?? "0")
    return Number.isFinite(r) && r > 0 ? r : 0
  }, [result.revenue_total])

  const chartData = useMemo(() => {
    if (!series?.length) return []
    return buildRows(series, mode, revenue)
  }, [series, mode, revenue])

  const refYear = useMemo(() => {
    const y = new Date().getFullYear()
    return Math.min(MAX_YEAR, Math.max(MIN_YEAR, y))
  }, [])

  if (!series?.length) return null

  return (
    <Card className="border-slate-200/80 dark:border-slate-700/80">
      <CardHeader className="pb-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">
              Transição temporal (2026–2033)
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-xl leading-snug">
              Carga líquida legado vs. CBS/IBS projetado por ano, com as premissas do simulador (LC 68/2024 — alíquotas estimadas).
            </p>
          </div>
          <div
            className="inline-flex rounded-lg border bg-muted/40 p-0.5 gap-0.5 shrink-0"
            role="group"
            aria-label="Escala do gráfico"
          >
            {(
              [
                ["brl", "R$"],
                ["pct", "% receita"],
              ] as const
            ).map(([k, lab]) => (
              <button
                key={k}
                type="button"
                disabled={k === "pct" && revenue <= 0}
                onClick={() => setMode(k)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  mode === k
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  k === "pct" && revenue <= 0 && "opacity-40 cursor-not-allowed",
                )}
              >
                {lab}
              </button>
            ))}
          </div>
        </div>
        {mode === "pct" && revenue <= 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Receita total indisponível; use a escala em R$.
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[MIN_YEAR, MAX_YEAR]}
              ticks={[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) =>
                mode === "brl"
                  ? `${(v / 1000).toFixed(0)}k`
                  : `${Number(v).toFixed(0)}%`
              }
            />
            <Tooltip content={<TransitionTooltip mode={mode} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              iconType="square"
              iconSize={8}
            />
            <ReferenceLine
              x={refYear}
              stroke="var(--color-muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: "Hoje",
                position: "top",
                fill: "var(--color-muted-foreground)",
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="legado"
              name="Legado (PIS/COFINS/ISS)"
              stackId="a"
              stroke={OLD_COLOR}
              fill={OLD_COLOR}
              fillOpacity={0.55}
            />
            <Area
              type="monotone"
              dataKey="novo"
              name="CBS/IBS (projetado)"
              stackId="a"
              stroke={NEW_COLOR}
              fill={NEW_COLOR}
              fillOpacity={0.55}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
