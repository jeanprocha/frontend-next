"use client"

import { Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { insightYearMismatch } from "../lib/tribia-insight-focus"
import { parseTaxTerms } from "../lib/tax-terms-parser"
import type { SimulationResponse } from "@/types/api"

interface TribiaInsightsProps {
  result: SimulationResponse
  /** Ano em que a simulação foi executada (POST); se diferente de `result.year`, aviso sobre insight vs foco */
  simulationRunYear?: number
  /**
   * Quando o veredito da Sessão 1 já reproduz a recomendação completa,
   * omitir este cartão para evitar duplicação.
   */
  omitWhenVereditoCovers?: boolean
}

export function TribiaInsights({
  result,
  simulationRunYear,
  omitWhenVereditoCovers,
}: TribiaInsightsProps) {
  const text = result.strategy_insight?.trim()
  if (!text) return null
  if (omitWhenVereditoCovers) return null

  const runYear = simulationRunYear ?? result.year
  const focusMismatch = insightYearMismatch(result.year, simulationRunYear)

  return (
    <Card className="border-l-4 border-l-amber-400/80 bg-amber-50/40 dark:border-l-amber-500/70 dark:bg-amber-950/20 print:border-l print:border-foreground/30 print:bg-transparent print:shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          <Lightbulb
            className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 board-ready:hidden print:hidden"
            aria-hidden
          />
          <span className="hidden board-ready:inline print:inline font-board-report text-sm font-semibold">
            Nota estratégica
          </span>
          <span className="board-ready:hidden print:hidden">TribIA — insight estratégico</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {focusMismatch ? (
          <p className="text-xs text-amber-900/90 dark:text-amber-100/90 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 leading-snug">
            O parágrafo abaixo foi gerado na execução da simulação para o ano {runYear}. Os cartões e a curva
            podem estar no ano de foco {result.year}; use os números dos cartões como referência principal para
            esse ano.
          </p>
        ) : null}
        <TooltipProvider delay={300}>
          <p className="line-clamp-4 text-sm text-foreground/90 leading-relaxed font-serif italic">
            {parseTaxTerms(text)}
          </p>
        </TooltipProvider>
        <p className="text-sm text-muted-foreground leading-snug">
          Sugestão ilustrativa com base nas premissas do simulador; não substitui parecer fiscal ou contábil.
        </p>
      </CardContent>
    </Card>
  )
}
