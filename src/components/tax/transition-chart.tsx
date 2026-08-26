"use client"

import { useId, useMemo, useState } from "react"
import { AlertTriangle, BadgeCheck } from "lucide-react"
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/format-money"
import { TransitionSparkline } from "@/components/tax/transition-sparkline"
import { parseApiDecimalForChart } from "@/lib/money-decimal"
import { clampTransitionYear } from "@/lib/transition-focus"
import { buildDualComplianceYearSet, computeOverlapBand } from "@/lib/transition-overlap"
import type { SimulationResponse, TransitionSeriesPoint } from "@/types/api"

// ─── Constantes cromáticas (system.md — slate legado, emerald CBS/IBS) ──────
const OLD_COLOR = "#64748b"
const NEW_COLOR = "#10b981"
const AB_A_COLOR = "#94a3b8"
const MIN_YEAR = 2026
const MAX_YEAR = 2033

type DisplayMode = "brl" | "pct"

// ─── Tipos internos de linha de gráfico ──────────────────────────────────────

interface ChartRow {
  year: number
  legado: number
  novo: number
  /** Ponto bruto para o tooltip de auditoria (Go, sem reprocessamento) */
  _raw: TransitionSeriesPoint
}

interface ChartRowAb {
  year: number
  legado: number
  novoA: number
  novoB: number
  /** Ponto bruto B para o tooltip de auditoria */
  _raw: TransitionSeriesPoint
}

// ─── Helpers de dados ────────────────────────────────────────────────────────

function buildRows(
  series: NonNullable<SimulationResponse["transition_series"]>,
  mode: DisplayMode,
  revenue: number,
): ChartRow[] {
  return series.map((p) => {
    let legado = parseApiDecimalForChart(p.old_tax_net)
    let novo = parseApiDecimalForChart(p.new_tax_net)
    if (mode === "pct" && revenue > 0) {
      legado = (legado / revenue) * 100
      novo = (novo / revenue) * 100
    }
    return { year: p.year, legado, novo, _raw: p }
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
  for (const p of [...current, ...baseline]) {
    if (p.year >= MIN_YEAR && p.year <= MAX_YEAR) years.add(p.year)
  }
  const sorted = [...years].sort((a, b) => a - b)
  return sorted.map((year) => {
    const c = curMap.get(year)
    const b = baseMap.get(year)
    let legado = c ? parseApiDecimalForChart(c.old_tax_net) : 0
    let novoB = c ? parseApiDecimalForChart(c.new_tax_net) : 0
    let novoA = b ? parseApiDecimalForChart(b.new_tax_net) : 0
    if (mode === "pct" && revenue > 0) {
      legado = (legado / revenue) * 100
      novoB = (novoB / revenue) * 100
      novoA = (novoA / revenue) * 100
    }
    return { year, legado, novoA, novoB, _raw: c ?? b! }
  })
}

/** Primeiro ano (série já ordenada) em que new_tax_net estritamente supera old_tax_net.
 *  Compara apenas valores já parseados — sem aritmética fiscal no frontend. */
function findCrossoverYear(rows: ChartRow[]): number | null {
  for (const row of rows) {
    if (row.novo > row.legado) return row.year
  }
  return null
}

/** Domínio Y honesto: garante que ambas as séries compartilham exactamente a mesma escala. */
function computeYDomain(values: number[]): [number, number] {
  const finite = values.filter(Number.isFinite)
  if (!finite.length) return [0, 1]
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const margin = (max - min) * 0.08 || Math.abs(max) * 0.08 || 1
  return [Math.max(0, min - margin), max + margin]
}

// ─── Tooltip de auditoria ────────────────────────────────────────────────────

/**
 * Linha de breakdown (Bruto / Créditos / Líquido) — exibe o que o Go já devolveu.
 * font-sans tabular-nums (system.md — sans operacional; serif proibido no tooltip).
 */
function BreakdownRows({
  label,
  gross,
  credits,
  net,
  mode,
}: {
  label: string
  gross: string | undefined
  credits: string | undefined
  net: string | undefined
  mode: DisplayMode
}) {
  if (!gross && !credits && !net) return null
  const fmt = (v: string | undefined) =>
    v && v.trim() !== "" && mode === "brl" ? formatBRL(v) : v ?? "—"
  return (
    <div className="mt-1.5 pt-1.5 border-t border-border/40 text-[10px]">
      <p className="font-semibold text-muted-foreground mb-0.5">{label}</p>
      <table className="w-full tabular-nums font-sans text-[10px]">
        <tbody>
          {gross && (
            <tr>
              <td className="text-muted-foreground pr-2">Bruto</td>
              <td className="text-right font-medium text-foreground">{fmt(gross)}</td>
            </tr>
          )}
          {credits && (
            <tr>
              <td className="text-muted-foreground pr-2">Créditos</td>
              <td className="text-right font-medium text-emerald-700 dark:text-emerald-400">
                {fmt(credits)}
              </td>
            </tr>
          )}
          {net && (
            <tr>
              <td className="text-muted-foreground pr-2">Líquido</td>
              <td className="text-right font-semibold text-foreground">{fmt(net)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function TransitionTooltip({
  active,
  payload,
  label,
  mode,
  abMode,
  dualComplianceYears,
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
  /** Anos em convivência de regime — para selo whisper-quiet no cabeçalho. */
  dualComplianceYears?: Set<number>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  const raw = (row as ChartRow | ChartRowAb | undefined)?._raw
  const fmt = (v: number) =>
    mode === "brl" ? formatBRL(v.toFixed(2)) : `${v.toFixed(2)}% da receita`

  return (
    <div className="rounded-lg border border-border/60 bg-popover shadow-md max-w-[240px] overflow-hidden">
      {/* Cabeçalho do ano */}
      <div className="px-3 py-2 border-b border-border/40">
        <p className="font-sans text-xs font-semibold tabular-nums flex items-center gap-1.5">
          {String(label)}
          {(row as ChartRow | undefined)?.novo !== undefined &&
            (row as ChartRow).novo > (row as ChartRow).legado && (
              <BadgeCheck
                className="size-3.5 text-emerald-600 shrink-0"
                aria-label="Primeiro ano em que o projetado supera o legado"
              />
            )}
        </p>
        {/* Selo de convivência — só nos anos em que 0 < α < 1 (factors do Go) */}
        {dualComplianceYears?.has(Number(label)) && (
          <p className="flex items-center gap-1 mt-0.5 font-sans text-[10px] text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-2.5 shrink-0" aria-hidden />
            Período de Convivência
          </p>
        )}
      </div>

      {/* Totais das séries */}
      <div className="px-3 py-2 space-y-1">
        {payload.map((p) => (
          <p
            key={String(p.dataKey)}
            className="font-sans text-xs tabular-nums"
            style={{ color: p.color }}
          >
            {p.name}: {fmt(Number(p.value))}
          </p>
        ))}
      </div>

      {/* Breakdown de auditoria — só exibe o que o Go devolveu */}
      {raw && !abMode && "novo" in (row ?? {}) ? (
        <div className="px-3 pb-2">
          {raw.current?.net_tax && (
            <BreakdownRows
              label="Legado"
              gross={raw.current.gross_tax}
              credits={raw.current.credits}
              net={raw.current.net_tax}
              mode={mode}
            />
          )}
          {raw.projected?.net_tax && (
            <BreakdownRows
              label="CBS/IBS"
              gross={raw.projected.gross_tax}
              credits={raw.projected.credits}
              net={raw.projected.net_tax}
              mode={mode}
            />
          )}
          {!raw.current?.net_tax && !raw.projected?.net_tax && (
            <p className="mt-1.5 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground leading-snug">
              {abMode
                ? "Legado a partir do cenário B."
                : "Valores ilustrativos (TribIA). Legado: PIS/COFINS/ISS · Novo: CBS/IBS."}
            </p>
          )}
        </div>
      ) : (
        <div className="px-3 pb-2">
          <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
            {abMode
              ? "Legado a partir do cenário B. A = referência; B = simulação actual."
              : "Legado: PIS/COFINS/ISS · Novo: CBS/IBS (LC 68/2024)."}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Auxiliares SVG: gradiente e rótulo de convivência ──────────────────────

/**
 * Injeta <defs><linearGradient> no SVG do Recharts.
 * Recharts clona children não-reconhecidos com props extras do chart; o index
 * signature absorve-as sem propagar para o DOM (evita warnings React do tipo
 * "unknown prop on DOM element").
 * Gradiente: slate-500 base (OLD_COLOR, já usado para o legado), opacidade
 * cresce da esquerda (2026, 2 %) para a direita (2032, 10 %) — tese de
 * complexidade crescente (system.md: cor explica significado).
 */
function GradientDefs(props: { gradientId?: string; [key: string]: unknown }) {
  const { gradientId } = props
  if (!gradientId) return null
  return (
    <defs>
      <linearGradient
        id={gradientId}
        x1="0"
        y1="0"
        x2="1"
        y2="0"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%"   stopColor={OLD_COLOR} stopOpacity={0.020} />
        <stop offset="55%"  stopColor={OLD_COLOR} stopOpacity={0.050} />
        <stop offset="85%"  stopColor={OLD_COLOR} stopOpacity={0.085} />
        <stop offset="100%" stopColor={OLD_COLOR} stopOpacity={0.100} />
      </linearGradient>
    </defs>
  )
}

interface OverlapLabelProps {
  /** Injectado pelo Recharts via React.cloneElement — coordenadas SVG da área. */
  viewBox?: { x: number; y: number; width: number; height: number }
  presentationMode?: boolean
}

/**
 * Rótulo "Transição de Regime (Dual Compliance)" posicionado no topo-esquerdo
 * da área sombreada, com offset interno para não colar na borda do clip.
 * Board-Ready: font-board-report (serif) + tracking-wide, conforme system.md.
 * Canvas operacional: sans sem tracking exagerado.
 */
function OverlapLabel({ viewBox, presentationMode = false }: OverlapLabelProps) {
  if (!viewBox) return null
  return (
    <text
      x={viewBox.x + 8}
      y={viewBox.y + 14}
      fill="var(--color-muted-foreground)"
      fontSize={presentationMode ? 10 : 8}
      fontFamily={
        presentationMode
          ? "var(--font-board-serif), ui-serif, Georgia, serif"
          : undefined
      }
      letterSpacing={presentationMode ? "0.06em" : undefined}
      opacity={0.55}
      aria-hidden="true"
    >
      Transição de Regime (Dual Compliance)
    </text>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

interface TransitionChartProps {
  result: SimulationResponse
  /** Cenário A (referência) para comparação A/B */
  abBaselineResult?: SimulationResponse
  /** Free: sparkline; Pro: gráfico completo */
  chartMode?: "full" | "sparkline"
  /** Pro: linha vertical no ano de leitura */
  focusYear?: number
  /** Pro: alterar ano de foco */
  onFocusYearChange?: (year: number) => void
  /** Board-Ready: serif em título/legendas, anotação de inflexão */
  presentationMode?: boolean
  /** Ambient UI coeso com o Veredito: dimmed + pulse só na área de plotagem */
  isRecalculating?: boolean
  /** Override pendente (debounce) — rebaixa opacidade sem pulse até o POST. */
  pendingSimulationSync?: boolean
}

const FOCUS_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033] as const

export function TransitionChart({
  result,
  abBaselineResult,
  chartMode = "full",
  focusYear,
  onFocusYearChange,
  presentationMode = false,
  isRecalculating = false,
  pendingSimulationSync = false,
}: TransitionChartProps) {
  const series = result.transition_series
  const chartDataStale = isRecalculating || pendingSimulationSync
  const baseSeries = abBaselineResult?.transition_series
  const abMode = Boolean(abBaselineResult && baseSeries?.length && series?.length)
  const [mode, setMode] = useState<DisplayMode>("brl")

  const revenue = useMemo(() => {
    const r = parseApiDecimalForChart(result.revenue_total ?? "0")
    return Number.isFinite(r) && r > 0 ? r : 0
  }, [result.revenue_total])

  const chartDataSingle = useMemo<ChartRow[]>(() => {
    if (!series?.length || abMode) return []
    return buildRows(series, mode, revenue)
  }, [series, mode, revenue, abMode])

  const chartDataAb = useMemo<ChartRowAb[]>(() => {
    if (!series?.length || !abMode || !baseSeries?.length) return []
    return buildAbRows(series, baseSeries, mode, revenue)
  }, [series, baseSeries, mode, revenue, abMode])

  /** Crossover: primeiro ano em que CBS/IBS supera o legado — derivado dos dados Go */
  const crossoverYear = useMemo<number | null>(() => {
    if (abMode) {
      // Em A/B, calcular sobre o cenário B (simulação actual)
      const rows = chartDataAb
      for (const row of rows) {
        if (row.novoB > row.legado) return row.year
      }
      return null
    }
    return findCrossoverYear(chartDataSingle)
  }, [chartDataSingle, chartDataAb, abMode])

  /** Domínio Y único — escala honesta para veracidade geométrica do cruzamento */
  const yDomain = useMemo<[number, number]>(() => {
    if (abMode) {
      const vals = chartDataAb.flatMap((r) => [r.legado, r.novoA, r.novoB])
      return computeYDomain(vals)
    }
    const vals = chartDataSingle.flatMap((r) => [r.legado, r.novo])
    return computeYDomain(vals)
  }, [chartDataSingle, chartDataAb, abMode])

  const refYear = useMemo(() => {
    const y = new Date().getFullYear()
    return Math.min(MAX_YEAR, Math.max(MIN_YEAR, y))
  }, [])

  // ── Overlap (convivência dual) — derivado de factors do motor Go ───────────
  // Hooks chamados incondicionalmente antes do early return (regra de hooks).
  const overlapBand = useMemo(() => computeOverlapBand(series), [series])
  const dualComplianceYears = useMemo(
    () => buildDualComplianceYearSet(series),
    [series],
  )
  // useId garante ID único por instância — seguro em SSR e em múltiplos gráficos.
  const rawUid = useId()
  const gradientId = `overlap-${rawUid.replace(/[^a-z0-9]/gi, "")}`

  if (!series?.length) return null

  const fy = focusYear != null ? clampTransitionYear(focusYear) : undefined

  // ── Sparkline (tier Free) ──────────────────────────────────────────────────
  if (chartMode === "sparkline" && !abMode) {
    return (
      <Card className="border-slate-200/80 dark:border-slate-700/80">
        <CardHeader className="pb-2">
          <CardTitle
            className={cn(
              "text-sm font-semibold",
              presentationMode && "font-board-report text-base",
            )}
          >
            Transição temporal (pré-visualização)
          </CardTitle>
          <p
            className={cn(
              "text-sm text-muted-foreground mt-1 max-w-xl leading-snug",
              presentationMode && "font-board-report",
            )}
          >
            Trajectória da carga CBS/IBS projectada (2026–2033). Plano Pro: gráfico completo, ano
            de foco e memória de cálculo.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <TransitionSparkline
              series={series}
              width={320}
              height={48}
              withFill
              aria-label="Pré-visualização da trajectória CBS/IBS por ano"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Gráfico completo (Pro) ─────────────────────────────────────────────────
  return (
    <Card className="border-slate-200/80 dark:border-slate-700/80">
      {/* CardHeader: mantém opacidade total — consultor sabe o quê está a actualizar */}
      <CardHeader className="pb-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle
              className={cn(
                "text-sm font-semibold",
                presentationMode && "font-board-report text-base font-semibold",
              )}
            >
              {abMode
                ? "Projeção comparativa (A vs B)"
                : "Evolução da Carga Tributária (2026–2033)"}
            </CardTitle>
            <p
              className={cn(
                "text-sm text-muted-foreground mt-1 max-w-xl leading-snug",
                presentationMode && "font-board-report",
              )}
            >
              {abMode
                ? "CBS/IBS projetado por ano: referência (A, tracejado) vs simulação actual (B, sólido). Legado a partir do cenário B."
                : "Carga líquida legado (PIS/COFINS/ISS) vs CBS/IBS projetado — escala única para veracidade do cruzamento (LC 68/2024)."}
            </p>

            {/* Legendas A/B em Board-Ready recebem font-board-report */}
            {abMode && (
              <div
                className={cn(
                  "mt-2 flex flex-wrap gap-4 text-xs font-semibold uppercase text-muted-foreground",
                  presentationMode && "font-board-report normal-case text-sm",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-slate-400" />
                  Cenário A (referência)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="inline-block h-0.5 w-4 bg-emerald-500" />
                  Cenário B (actual)
                </span>
              </div>
            )}

            {/* Selector de ano de foco (Pro) */}
            {onFocusYearChange && fy != null && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label
                  htmlFor="transition-focus-year"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Ano de foco
                </label>
                <select
                  id="transition-focus-year"
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-sm"
                  value={fy}
                  onChange={(e) => onFocusYearChange(Number(e.target.value))}
                >
                  {FOCUS_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Toggle R$ / % receita — sem pulse aqui (informação estável) */}
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

      <CardContent className="pt-0 space-y-3">
        {/*
         * Área de plotagem — único bloco com ambient UI durante recálculo.
         * aria-busy + dim+pulse apenas aqui; cabeçalho e anotação permanecem legíveis
         * (paridade com FinancialVerdictHeroCard — system.md whisper-quiet).
         */}
        <div
          aria-busy={chartDataStale}
          aria-label={
            isRecalculating
              ? "A sincronizar série temporal com o motor Go…"
              : pendingSimulationSync
                ? "Série temporal ainda a reflectir a última classificação"
                : undefined
          }
          className={cn(
            "transition-opacity duration-300",
            chartDataStale && "opacity-50",
            isRecalculating && "motion-safe:animate-pulse",
          )}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={(abMode ? chartDataAb : chartDataSingle) as object[]}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              {/*
               * Gradiente de convivência — tapete atrás da grelha e das linhas.
               * GradientDefs injeta <defs> no SVG; ReferenceArea consome o fill.
               * isFront omitido (default false): Recharts renderiza atrás das Lines.
               */}
              <GradientDefs gradientId={gradientId} />
              {overlapBand && (
                <ReferenceArea
                  x1={overlapBand.startYear - 0.5}
                  x2={overlapBand.endYear + 0.5}
                  fill={`url(#${gradientId})`}
                  fillOpacity={1}
                  stroke="none"
                  label={<OverlapLabel presentationMode={presentationMode} />}
                />
              )}

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                type="number"
                domain={[MIN_YEAR, MAX_YEAR]}
                ticks={[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              {/*
               * Eixo Y único compartilhado — veracidade geométrica do cruzamento.
               * Domínio calculado sobre o conjunto legado + novo de todas as séries.
               * Proibido yAxisId duplo (plano 4.1.1 — escala integrity).
               */}
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v) =>
                  mode === "brl"
                    ? `${(v / 1000).toFixed(0)}k`
                    : `${Number(v).toFixed(0)}%`
                }
              />
              <Tooltip
                content={
                  <TransitionTooltip
                    mode={mode}
                    abMode={abMode}
                    dualComplianceYears={dualComplianceYears}
                  />
                }
              />
              <Legend
                wrapperStyle={{
                  fontSize: presentationMode ? 13 : 11,
                  paddingTop: 12,
                  fontFamily: presentationMode ? "var(--font-board-report, serif)" : undefined,
                }}
                iconType="line"
                iconSize={8}
              />

              {/* Hoje */}
              <ReferenceLine
                x={refYear}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: "Hoje",
                  position: "top",
                  fill: "var(--color-muted-foreground)",
                  fontSize: 10,
                }}
              />

              {/* Ano de foco (Pro) */}
              {fy != null && (
                <ReferenceLine
                  x={fy}
                  stroke="var(--color-emerald-600, #059669)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.85}
                  label={{
                    value: "Foco",
                    position: "top",
                    fill: "var(--color-emerald-600, #059669)",
                    fontSize: 10,
                  }}
                />
              )}

              {/*
               * Crossover — primeiro ano em que CBS/IBS supera legado.
               * Compara apenas valores já parseados do payload Go.
               * whisper-quiet: traço discreto, sem competir com linha de foco.
               * Em A/B: crossover calculado sobre cenário B (simulação actual).
               */}
              {crossoverYear != null && (
                <ReferenceLine
                  x={crossoverYear}
                  stroke={NEW_COLOR}
                  strokeDasharray="2 4"
                  strokeOpacity={0.45}
                  label={{
                    value: "×",
                    position: "insideTopRight",
                    fill: NEW_COLOR,
                    fontSize: 10,
                    opacity: 0.7,
                  }}
                />
              )}

              {/*
               * Delimitação whisper-quiet do período de convivência.
               * strokeDasharray="3 3" e strokeOpacity=0.30 — abaixo da linha
               * Foco (~0.85) e de "Hoje" (~0.50) para não gerar ruído visual.
               * Marco esquerdo: início da convivência (2026).
               * Marco direito: primeiro ano do regime pleno (endYear + 1 = 2033).
               */}
              {overlapBand && (
                <>
                  <ReferenceLine
                    x={overlapBand.startYear}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="3 3"
                    strokeOpacity={0.30}
                  />
                  <ReferenceLine
                    x={overlapBand.endYear + 1}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="3 3"
                    strokeOpacity={0.30}
                  />
                </>
              )}

              {/* Séries — modo simples */}
              {!abMode && (
                <>
                  <Line
                    type="monotone"
                    dataKey="legado"
                    name="Legado (PIS/COFINS/ISS)"
                    stroke={OLD_COLOR}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: OLD_COLOR }}
                  />
                  <Line
                    type="monotone"
                    dataKey="novo"
                    name="CBS/IBS (projetado)"
                    stroke={NEW_COLOR}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: NEW_COLOR }}
                  />
                </>
              )}

              {/* Séries — modo A/B */}
              {abMode && (
                <>
                  <Line
                    type="monotone"
                    dataKey="legado"
                    name="Legado (B)"
                    stroke={OLD_COLOR}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
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
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/*
         * Anotação de inflexão (Board-Ready).
         * font-board-report só em presentationMode — system.md tipografia.
         * Nunca inventada: omitida se não houver cruzamento na série.
         */}
        {presentationMode && crossoverYear != null && (
          <p className="font-board-report text-sm text-muted-foreground text-center leading-snug print:text-foreground">
            Inflexão de Carga em{" "}
            <span className="font-semibold text-foreground tabular-nums">{crossoverYear}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
