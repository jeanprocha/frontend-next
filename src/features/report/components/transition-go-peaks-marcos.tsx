"use client"

import { TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL, formatPct } from "@/lib/format-money"
import { parseApiDecimal } from "@/lib/money-decimal"
import { peakYearMaxDelta, peakYearMaxDestinationNet } from "@/lib/transition-series-peaks"
import type { TransitionSeriesPoint } from "@/types/api"

interface TransitionGoPeaksMarcosProps {
  series: TransitionSeriesPoint[] | undefined
  focusYear: number
}

/**
 * Picos determinísticos + marcos temporais num único bloco (Tab Go),
 * evitando repetir o mesmo valor (ex.: 2033) em cartões separados.
 */
export function TransitionGoPeaksMarcos({ series, focusYear }: TransitionGoPeaksMarcosProps) {
  if (!series?.length) return null

  const destPeak = peakYearMaxDestinationNet(series)
  const deltaPeak = peakYearMaxDelta(series)

  const byYear = (y: number) => series.find((p) => p.year === y)
  const focus = byYear(focusYear)
  const y2027 = byYear(2027)
  const y2031 = byYear(2031)
  const y2033 = byYear(2033)

  if (!focus) return null

  const dFocus = parseApiDecimal(focus.new_tax_net)
  const d27 = parseApiDecimal(y2027?.new_tax_net)
  const d31 = parseApiDecimal(y2031?.new_tax_net)

  const paragraphs: string[] = []

  if (destPeak) {
    const is2033Horizon = destPeak.year === 2033 && y2033
    if (is2033Horizon) {
      paragraphs.push(
        `Horizonte e pico de carga CBS/IBS líquida projetada em 2033 (${formatBRL(destPeak.value)} no modelo) — referência de alíquota plena e ponto máximo da série neste cenário; útil para provisões e planejamento de margem em toda a transição.`,
      )
    } else {
      paragraphs.push(
        `Neste cenário, a carga CBS/IBS líquida projetada atinge o máximo em ${destPeak.year} (${formatBRL(destPeak.value)} no modelo). Útil para antecipar provisões e o fluxo de caixa nesse ano.`,
      )
    }
  } else if (y2033) {
    paragraphs.push(
      `Horizonte 2033 (referência de alíquota plena no modelo): carga destino ${formatBRL(y2033.new_tax_net)} — base para planejamento de margem ao longo da transição.`,
    )
  }

  if (y2033 && destPeak && destPeak.year !== 2033) {
    paragraphs.push(
      `Horizonte 2033: carga destino ${formatBRL(y2033.new_tax_net)} — referência de planejamento ao longo da transição (o pico de carga na série ocorre em outro ano).`,
    )
  }

  if (deltaPeak && (!destPeak || deltaPeak.year !== destPeak.year)) {
    paragraphs.push(
      `O maior aumento de carga frente ao legado (delta projetado − legado na série) ocorre em ${deltaPeak.year} (${formatBRL(deltaPeak.value)}).`,
    )
  }

  if (y2027 && y2031) {
    paragraphs.push(
      `Marcos para contratos: a carga CBS/IBS líquida projetada passa de ${formatBRL(y2027.new_tax_net)} (2027) para ${formatBRL(y2031.new_tax_net)} (2031) neste modelo — intervalo útil para rever preços e cláusulas em contratos de longo prazo.`,
    )
  }

  if (focusYear === 2031 && d27 && d31 && !d27.isZero()) {
    const pct = formatPct(d31.sub(d27).div(d27.abs()).mul(100).toFixed(1))
    paragraphs.push(
      `Em 2031, a carga líquida CBS/IBS projetada (${formatBRL(focus.new_tax_net)}) difere de 2027 em aproximadamente ${pct} neste modelo.`,
    )
  } else if (focusYear === 2027 && d27 && d31 && !d27.isZero()) {
    const pct = formatPct(d31.sub(d27).div(d27.abs()).mul(100).toFixed(1))
    paragraphs.push(
      `Entre 2027 e 2031, a carga CBS/IBS projetada evolui cerca de ${pct} neste cenário (valores ilustrativos TribIA).`,
    )
  } else if (dFocus && d31 && focusYear !== 2031 && !d31.isZero()) {
    const diff = formatPct(dFocus.sub(d31).div(d31.abs()).mul(100).toFixed(1))
    paragraphs.push(
      `No ano ${focusYear}, a carga CBS/IBS projetada (${formatBRL(focus.new_tax_net)}) está cerca de ${diff} em relação a 2031 no mesmo modelo.`,
    )
  }

  if (paragraphs.length === 0) return null

  return (
    <Card className="border-emerald-600/25 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-950/25 print:border print:border-foreground/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
          <TrendingUp className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
          Picos, marcos e leitura temporal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm leading-relaxed text-foreground/90">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <p className="text-xs text-muted-foreground">
          Premissas do simulador TribIA; não substitui assessoria. Valores determinísticos a partir da série 2026–2033
          devolvida pelo motor.
        </p>
      </CardContent>
    </Card>
  )
}
