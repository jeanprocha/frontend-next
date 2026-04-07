"use client"

import { Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { parseTaxTerms } from "@/lib/tax-terms-parser"
import type { SimulationResponse } from "@/types/api"

interface TribiaInsightsProps {
  result: SimulationResponse
}

export function TribiaInsights({ result }: TribiaInsightsProps) {
  const text = result.strategy_insight?.trim()
  if (!text) return null

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
        <TooltipProvider delay={300}>
          <p className="text-sm text-foreground/90 leading-relaxed font-serif italic">
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
