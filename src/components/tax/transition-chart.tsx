"use client"

import { useMemo, useState } from "react"
import { BadgeCheck } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
const AB_A_COLOR = "#94a3b8"
const MIN_YEAR = 2026
const MAX_YEAR = 2033

type DisplayMode = "brl" | "pct"

interface ChartRow {
  year: number
  legado: number
  novo: number
  inflection: boolean
}

interface ChartRowAb {
  year: number
  legado: number
  novoA: number
  novoB: number
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

function buildAbRows(
  current: NonNullable<SimulationResponse["transition_series"]>,
  baseline: NonNullable<SimulationResponse["transition_series"]>,
  mode: DisplayMode,
  revenue: number,
): ChartRowAb[] {
  const curMap = new Map(current.map((p) => [p.year, p]))
  const baseMap = new Map(baseline.map((p) => [p.year, p]))
  const years = new Set<number>()
  for (const p of current) {
    if (p.year >= MIN_YEAR && p.year <= MAX_YEAR) years.add(p.year)
  }
  for (const p of baseline) {
    if (p.year >= MIN_YEAR && p.year <= MAX_YEAR) years.add(p.year)
  }
  const sorted = [...years].sort((a, b) => a - b)

  let inflectionYear: number | null = null
  for (const y of sorted) {
    const c = curMap.get(y)
    if (!c) continue
    const oldN = parseMoney(c.old_tax_net)
    const newN = parseMoney(c.new_tax_net)
    if (newN < oldN) {
      inflectionYear = y
      break
    }
  }

  return sorted.map((year) => {
    const c = curMap.get(year)
    const b = baseMap.get(year)
    let legado = c ? parseMoney(c.old_tax_net) : 0
    let novoB = c ? parseMoney(c.new_tax_net) : 0
    let novoA = b ? parseMoney(b.new_tax_net) : 0
    if (mode === "pct" && revenue > 0) {
      legado = (legado / revenue) * 100
      novoB = (novoB / revenue) * 100
      novoA = (novoA / revenue) * 100
    }
    return {
      year,
      legado,
      novoA,
      novoB,
      inflection: inflectionYear !== null && year === inflectionYear,
    }
  })
}

function TransitionTooltip({
  active,
  payload,
  label,
  mode,
  abMode,
}: {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    color?: string
    dataKey?: string
    payload?: ChartRow | ChartRowAb
  }>
  label?: string | number
  mode: DisplayMode
  abMode?: boolean
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
        <p className="mt-1.5 pt-1.5 border-t text-xs text-muted-foreground leading-snug">
          {abMode
            ? "Legado a partir do cenário B. CBS/IBS: A = referência congelada, B = simulação atual."
            : "Legado: PIS/COFINS/ISS (modelo atual). Novo: CBS/IBS (projetado). Valores ilustrativos (TribIA)."}
        </p>
      )}
    </div>
  )
}

interface TransitionChartProps {
  result: SimulationResponse
  /** Cenário A (referência): compara CBS/IBS projetado (new) vs cenário B = result */
  abBaselineResult?: SimulationResponse
}

export function TransitionChart({ result, abBaselineResult }: TransitionChartProps) {
  const series = result.transition_series
  const baseSeries = abBaselineResult?.transition_series
  const abMode = Boolean(abBaselineResult && baseSeries?.length && series?.length)
  const [mode, setMode] = useState<DisplayMode>("brl")

  const revenue = useMemo(() => {
    const r = parseFloat(result.revenue_total ?? "0")
    return Number.isFinite(r) && r > 0 ? r : 0
  }, [result.revenue_total])

  const chartDataSingle = useMemo(() => {
    if (!series?.length || abMode) return [] as ChartRow[]
    return buildRows(series, mode, revenue)
  }, [series, mode, revenue, abMode])

  const chartDataAb = useMemo(() => {
    if (!series?.length || !abMode || !baseSeries?.length) return [] as ChartRowAb[]
    return buildAbRows(series, baseSeries, mode, revenue)
  }, [series, baseSeries, mode, revenue, abMode])

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
              {abMode ? "Projeção comparativa (A vs B)" : "Transição temporal (2026–2033)"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-snug">
              {abMode
                ? "CBS/IBS projetado por ano: referência (A, tracejado) vs simulação atual (B, sólido). Legado a partir do cenário B."
                : "Carga líquida legado vs. CBS/IBS projetado por ano, com as premissas do simulador (LC 68/2024 — alíquotas estimadas)."}
            </p>
            {abMode && (
              <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold uppercase text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-slate-400" />
                  Cenário A (referência)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="inline-block h-0.5 w-4 bg-emerald-500" />
                  Cenário B (atual)
                </span>
              </div>
            )}
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
          {abMode ? (
            <ComposedChart data={chartDataAb} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              <Tooltip content={<TransitionTooltip mode={mode} abMode />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                iconType="line"
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
                name="Legado (B)"
                stroke={OLD_COLOR}
                fill={OLD_COLOR}
                fillOpacity={0.35}
              />
              <Line
                type="monotone"
                dataKey="novoA"
                name="CBS/IBS cenário A"
                stroke={AB_A_COLOR}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="novoB"
                name="CBS/IBS cenário B"
                stroke={NEW_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          ) : (
            <AreaChart data={chartDataSingle} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
