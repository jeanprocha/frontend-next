"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { TransitionSeriesPoint } from "@/types/api"

/** Alinhado a TransitionChart — carga CBS/IBS projetada (new_tax_net). */
const SERIES_STROKE = "#10b981"
const MIN_YEAR = 2026
const MAX_YEAR = 2033

function parseMoney(s: string): number {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function filterSeries(points: TransitionSeriesPoint[]): TransitionSeriesPoint[] {
  return [...points]
    .filter((p) => p.year >= MIN_YEAR && p.year <= MAX_YEAR)
    .sort((a, b) => a.year - b.year)
}

export interface TransitionSparklineProps {
  series: TransitionSeriesPoint[] | undefined | null
  className?: string
  width?: number
  height?: number
  /** Mostrar área preenchida suave por baixo da linha. */
  withFill?: boolean
  "aria-label"?: string
}

/**
 * Sparkline da trajetória new_tax_net (2026–2033) — mesma cor semântica que o gráfico principal.
 */
export function TransitionSparkline({
  series,
  className,
  width = 88,
  height = 32,
  withFill = true,
  "aria-label": ariaLabel = "Tendência da carga líquida CBS/IBS por ano",
}: TransitionSparklineProps) {
  const { pathD, areaD } = useMemo(() => {
    const pts = filterSeries(series ?? [])
    if (pts.length < 2) {
      return { pathD: "", areaD: "" }
    }
    const values = pts.map((p) => parseMoney(p.new_tax_net))
    let min = Math.min(...values)
    let max = Math.max(...values)
    if (min === max) {
      min -= 1
      max += 1
    }
    const pad = (max - min) * 0.08
    min -= pad
    max += pad
    const n = pts.length
    const xAt = (i: number) => (i / (n - 1)) * width
    const yAt = (v: number) => height - ((v - min) / (max - min)) * (height - 4) - 2
    const lineParts: string[] = []
    for (let i = 0; i < n; i++) {
      const x = xAt(i)
      const y = yAt(values[i])
      lineParts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    }
    const path = lineParts.join(" ")
    const firstX = xAt(0).toFixed(2)
    const lastX = xAt(n - 1).toFixed(2)
    const bottom = height
    const area = `${path} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`
    return { pathD: path, areaD: area, minY: min, maxY: max }
  }, [series, width, height])

  const pts = filterSeries(series ?? [])
  if (pts.length < 2) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-border/60 bg-muted/20 flex items-center justify-center text-xs text-muted-foreground tabular-nums",
          className,
        )}
        style={{ width, height }}
        aria-hidden
      >
        —
      </div>
    )
  }

  return (
    <svg
      className={cn("shrink-0 overflow-visible", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
    >
      {withFill && areaD ? (
        <path d={areaD} fill={SERIES_STROKE} fillOpacity={0.12} stroke="none" />
      ) : null}
      <path
        d={pathD}
        fill="none"
        stroke={SERIES_STROKE}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
