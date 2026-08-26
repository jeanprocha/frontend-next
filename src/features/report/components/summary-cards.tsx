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
import { formatBRL, formatPct } from "@/lib/format-money"
import { parseApiDecimal, parseApiDecimalForChart } from "@/lib/money-decimal"
import type { SimulationResponse } from "@/types/api"

interface SummaryCardsProps {
  result: SimulationResponse
  /** Cenário A (referência) para comparar carga líquida projetada lado a lado com `result` (B) */
  compareBaseline?: SimulationResponse
  /** PRO: rótulos «Bloco Legado» / «Bloco Destino», legenda do gráfico e nota de anatomia temporal */
  overlapAnatomy?: boolean
  /** Ano da última execução POST (quando difere de `result.year`, mostra aviso de foco na curva) */
  simulationRunYear?: number
  /** Quando o delta já é protagonista no Hero (veredito executivo), ocultar o terceiro cartão de delta aqui. */
  hideDeltaCard?: boolean
}

// Tooltip customizado para exibir valores em BRL
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- herança FE-0: dívida pré-existente; recharts não expõe um tipo estreito para tooltip props aqui; resolver ao tocar este arquivo
function BrlTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- herança FE-0: dívida pré-existente; resolver ao tocar este arquivo */}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {formatBRL(String(p.value))}
        </p>
      ))}
    </div>
  )
}

function netTaxSemantics(netStr: string): { isCreditor: boolean; netLabel: string } {
  const d = parseApiDecimal(netStr)
  const isCreditor = d ? d.lt(0) : false
  return {
    isCreditor,
    netLabel: isCreditor ? "Crédito acumulado recuperável (ilustrativo)" : "Imposto líquido a pagar (ilustrativo)",
  }
}

export function SummaryCards({
  result,
  compareBaseline,
  overlapAnatomy = false,
  simulationRunYear,
  hideDeltaCard = false,
}: SummaryCardsProps) {
  let deltaD = parseApiDecimal(result.delta?.trim())
  const projD = parseApiDecimal(result.projected.net_tax)
  const currD = parseApiDecimal(result.current.net_tax)
  if (!deltaD && projD && currD) {
    deltaD = projD.sub(currD)
  }
  const currentNetMeta = netTaxSemantics(result.current.net_tax)
  const projectedNetMeta = netTaxSemantics(result.projected.net_tax)
  // delta = projetado − atual (API Go). Negativo = economia; positivo = custo adicional.
  const neutral = !deltaD || deltaD.isZero()
  const saving = deltaD ? deltaD.lt(0) : false
  const increase = deltaD ? deltaD.gt(0) : false
  const absDeltaStr = deltaD ? deltaD.abs().toFixed(2) : "0"
  const deltaLabel = neutral
    ? "Sem variação"
    : saving
      ? "Economia projetada"
      : "Aumento de carga"
  const deltaDisplay =
    neutral
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

  const legacyKey = overlapAnatomy ? "Legado" : "Atual"
  const destKey = overlapAnatomy ? "Destino" : "Projetado"
  const chartDataDefault = [
    {
      name: "Bruto",
      Atual: parseApiDecimalForChart(result.current.gross_tax),
      Projetado: parseApiDecimalForChart(result.projected.gross_tax),
    },
    {
      name: "Créditos",
      Atual: parseApiDecimalForChart(result.current.credits),
      Projetado: parseApiDecimalForChart(result.projected.credits),
    },
    {
      name: "Líquido",
      Atual: parseApiDecimalForChart(result.current.net_tax),
      Projetado: parseApiDecimalForChart(result.projected.net_tax),
    },
  ]
  const chartDataOverlapRows = [
    {
      name: "Bruto",
      [legacyKey]: parseApiDecimalForChart(result.current.gross_tax),
      [destKey]: parseApiDecimalForChart(result.projected.gross_tax),
    },
    {
      name: "Créditos",
      [legacyKey]: parseApiDecimalForChart(result.current.credits),
      [destKey]: parseApiDecimalForChart(result.projected.credits),
    },
    {
      name: "Líquido",
      [legacyKey]: parseApiDecimalForChart(result.current.net_tax),
      [destKey]: parseApiDecimalForChart(result.projected.net_tax),
    },
  ]
  const chartData = overlapAnatomy ? chartDataOverlapRows : chartDataDefault

  const chartNumericValues = chartData
    .flatMap((d) =>
      Object.entries(d)
        .filter(([k]) => k !== "name")
        .map(([, v]) => v as number),
    )
    .filter(Number.isFinite)
  const yDataMin = chartNumericValues.length ? Math.min(...chartNumericValues) : 0
  const yDataMax = chartNumericValues.length ? Math.max(...chartNumericValues) : 0
  const yFloor = Math.min(0, yDataMin)
  const yCeil = Math.max(0, yDataMax)
  const span = yCeil - yFloor
  const yPad = Math.max(span * 0.08, Math.abs(yCeil) * 0.05, Math.abs(yFloor) * 0.05, 1)

  const focusDiffersFromRun =
    overlapAnatomy &&
    simulationRunYear != null &&
    Number.isFinite(simulationRunYear) &&
    simulationRunYear !== result.year

  return (
    <div className="space-y-4">
      {compareBaseline && (
        <Card className="border border-border/80 bg-muted/30 dark:bg-muted/20 print:border print:border-foreground/25 print:bg-transparent print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comparativo A/B — carga líquida projetada (CBS/IBS)
            </CardTitle>
            <p className="text-sm text-muted-foreground/80 mt-0.5 leading-snug">
              Referência congelada (A) vs simulação atual (B). Os cartões abaixo referem-se ao cenário B.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3 print:border-foreground/25 print:bg-transparent">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Simulação A (referência) · {compareBaseline.year}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-600 dark:text-slate-300">
                  {formatBRL(compareBaseline.projected.net_tax)}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-50/40 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-950/20 print:border print:border-foreground/25 print:bg-transparent">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90 dark:text-emerald-300/90 print:text-foreground">
                  Simulação B (atual) · {result.year}
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 print:text-foreground">
                  {formatBRL(result.projected.net_tax)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-snug">
              Se alterou serviços, despesas ou contexto após congelar A, trate o comparativo como ilustrativo.
            </p>
          </CardContent>
        </Card>
      )}

      {overlapAnatomy ? (
        <p className="text-xs text-muted-foreground leading-snug rounded-md border border-border/80 bg-muted/20 px-3 py-2">
          {focusDiffersFromRun ? (
            <>
              Ano de foco na curva: <span className="font-medium text-foreground">{result.year}</span> (simulação
              executada para {simulationRunYear}). Os cartões mostram a anatomia da carga nesse ponto temporal —
              modelo comparativo dual (dois blocos em paralelo).
            </>
          ) : (
            <>
              Mapa de convivência para o ano{" "}
              <span className="font-medium text-foreground">{result.year}</span>: blocos legado e destino
              modelados em paralelo; não é um único imposto «híbrido» somado.
            </>
          )}
        </p>
      ) : null}

      {/* ── Cartões legado / destino / delta (delta opcional se já no Hero) ─ */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          hideDeltaCard ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {/* Regime atual / Bloco legado */}
        <Card
          className={cn(
            "border border-border/80 border-l-4 border-l-muted-foreground/30 print:border print:border-foreground/25 print:bg-transparent print:shadow-none",
            currentNetMeta.isCreditor &&
              "border-l-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/15 dark:border-l-emerald-500/50 print:border-l-foreground/35 print:bg-transparent",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {overlapAnatomy ? "Bloco Legado" : "Regime Atual"}
            </CardTitle>
            <p className="text-sm text-muted-foreground/70 -mt-0.5">
              {overlapAnatomy ? `PIS/COFINS + ISS · ${result.year}` : "PIS/COFINS + ISS"}
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                currentNetMeta.isCreditor && "text-emerald-700 dark:text-emerald-300 print:text-foreground",
              )}
            >
              {formatBRL(result.current.net_tax)}
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                currentNetMeta.isCreditor
                  ? "text-emerald-800/90 dark:text-emerald-300/90 print:text-foreground"
                  : "text-muted-foreground/80",
              )}
            >
              {currentNetMeta.netLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              Bruto {formatBRL(result.current.gross_tax)}
              <span className="mx-1 opacity-40">·</span>
              Créditos {formatBRL(result.current.credits)}
            </p>
          </CardContent>
        </Card>

        {/* Projetado / Bloco destino */}
        <Card
          className={cn(
            "border border-border/80 border-l-4 border-l-accent print:border print:border-foreground/25 print:bg-transparent print:shadow-none",
            projectedNetMeta.isCreditor &&
              "border-l-emerald-500/70 bg-emerald-50/55 dark:bg-emerald-950/20 dark:border-l-emerald-400/60 print:border-l-foreground/35 print:bg-transparent",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {overlapAnatomy ? "Bloco Destino" : `Projetado ${result.year}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground/70 -mt-0.5">
              {overlapAnatomy ? `CBS · IBS líquido · ${result.year}` : "CBS · IBS"}
            </p>
          </CardHeader>
          <CardContent className="space-y-1">
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                projectedNetMeta.isCreditor
                  ? "text-emerald-700 dark:text-emerald-300 print:text-foreground"
                  : "text-accent print:text-foreground",
              )}
            >
              {formatBRL(result.projected.net_tax)}
            </p>
            <p
              className={cn(
                "text-sm font-medium",
                projectedNetMeta.isCreditor
                  ? "text-emerald-800/90 dark:text-emerald-300/90 print:text-foreground"
                  : "text-muted-foreground/80",
              )}
            >
              {projectedNetMeta.netLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              Bruto {formatBRL(result.projected.gross_tax)}
              <span className="mx-1 opacity-40">·</span>
              Créditos {formatBRL(result.projected.credits)}
            </p>
          </CardContent>
        </Card>

        {!hideDeltaCard ? (
          <Card
            className={cn(
              deltaCardClass,
              "border border-border/80 print:border print:border-foreground/25 print:bg-transparent print:shadow-none",
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <DeltaIcon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                {deltaLabel}
              </CardTitle>
              <p className="text-sm text-muted-foreground/70 -mt-0.5">
                {overlapAnatomy ? "vs. bloco legado" : "vs. regime atual"}
              </p>
            </CardHeader>
            <CardContent className="space-y-1">
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  deltaTextClass,
                  "print:text-foreground",
                )}
              >
                {deltaDisplay}
              </p>
              <p className="text-xs text-muted-foreground">
                Variação de {formatPct(result.delta_pct)}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* ── Gráfico comparativo ─────────────────────────────────────────── */}
      <Card className="border border-border/80 tribia-shadow-elevated print:border print:border-foreground/25 print:bg-transparent print:shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {overlapAnatomy
              ? `Comparativo visual — legado vs. destino (${result.year})`
              : `Comparativo visual — Atual vs. ${result.year}`}
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
                dataKey={legacyKey}
                fill="var(--color-chart-2)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey={destKey}
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
