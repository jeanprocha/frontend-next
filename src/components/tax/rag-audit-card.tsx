"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfidenceGauge } from "@/components/tax/confidence-gauge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ragScoreFormulaSummary } from "@/lib/rag-metadata"
import { useTaxStore } from "@/store/useTaxStore"
import type { AiMetadata } from "@/types/api"

export interface RagAuditCardProps {
  aiMetadata: AiMetadata | null | undefined
  className?: string
}

function HowCalculatedBody({ meta }: { meta: AiMetadata }) {
  const b = meta.breakdown
  const pct = (x: number) => `${Math.round(x * 100)}%`
  return (
    <div className="space-y-3 p-4 text-xs leading-relaxed">
      <p className="font-medium text-foreground">Fórmula</p>
      <p className="text-muted-foreground">{ragScoreFormulaSummary()}</p>
      {b ? (
        <ul className="list-none space-y-1.5 border-t border-border/60 pt-3 text-muted-foreground">
          <li>
            Similaridade RAG média (linhas com evidência): <span className="font-mono text-foreground">{pct(b.rag_similarity_mean)}</span>
          </li>
          <li>
            Confiança média do classificador: <span className="font-mono text-foreground">{pct(b.llm_confidence_mean)}</span>
          </li>
          <li>
            Cobertura de evidências: <span className="font-mono text-foreground">{pct(b.evidence_coverage)}</span>{" "}
            <span className="text-xs">
              ({b.with_evidence_count}/{b.classified_count} linhas)
            </span>
          </li>
        </ul>
      ) : (
        <p className="border-t border-border/60 pt-3 text-muted-foreground">
          Registo sem desagregado numérico; o percentual mostrado é o score consolidado guardado.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Não substitui parecer fiscal. O motor Go calcula impostos; este indicador resume a camada de
        recuperação legislativa e classificação por IA.
      </p>
    </div>
  )
}

/**
 * Painel de transparência RAG na vista de resultados (relevância + fontes citadas).
 */
export function RagAuditCard({ aiMetadata, className }: RagAuditCardProps) {
  const [howOpen, setHowOpen] = useState(false)
  const openMacroBriefing = useTaxStore((s) => s.openAnalystBriefingFromMacro)

  if (!aiMetadata) {
    return (
      <div
        id="tribia-rag-macro-anchor"
        className={cn(
          "rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-3 text-xs text-muted-foreground",
          className,
        )}
      >
        <p className="font-medium text-foreground/80">Auditoria RAG</p>
        <p className="mt-1 leading-relaxed">
          Não há trechos da lei associados a esta simulação (ex.: fluxo CSV sem classificação completa
          ou registo antigo). Execute uma simulação manual com classificação por IA para ver
          relevância e fontes.
        </p>
      </div>
    )
  }

  const score = aiMetadata.confidence_score
  const sources = aiMetadata.sources_analyzed

  return (
    <div
      id="tribia-rag-macro-anchor"
      className={cn(
        "rounded-xl border border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-500/20 dark:bg-emerald-950/20",
        "print:border print:border-foreground/25 print:bg-transparent print:!shadow-none",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-6">
        <ConfidenceGauge
          score={score}
          onActivate={() => openMacroBriefing(aiMetadata)}
          className="shrink-0 border-emerald-200/40 bg-white/60 dark:border-emerald-800/30 dark:bg-emerald-950/40 print:border print:border-foreground/20 print:bg-transparent"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles
              className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 board-ready:hidden print:hidden"
              aria-hidden
            />
            <span className="hidden board-ready:inline print:inline text-xs font-bold uppercase tracking-wide text-foreground">
              Auditado via RAG Engine
            </span>
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-900 dark:text-emerald-200 print:text-foreground">
              Fontes analisadas
            </span>
            <Popover open={howOpen} onOpenChange={setHowOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs font-semibold uppercase tracking-wide text-emerald-800 underline-offset-2 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 board-ready:hidden print:hidden"
                >
                  Como calculámos isto
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[min(100vw-2rem,320px)] p-0">
                <HowCalculatedBody meta={aiMetadata} />
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-sm leading-relaxed text-emerald-900/80 dark:text-emerald-200/80 print:text-foreground">
            Na tabela abaixo, cada linha desdobra a fundamentação e as evidências correspondentes a este índice
            global.
          </p>
          {sources.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source) => (
                <Badge
                  key={source}
                  variant="outline"
                  className="border-emerald-200/80 bg-white/90 text-xs font-medium text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200 print:border-foreground/30 print:bg-transparent print:text-foreground"
                >
                  {source}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-emerald-900/70 dark:text-emerald-200/70">
              Trechos recuperados sem identificador de artigo legível; o score acima reflete a fórmula
              agregada sobre similaridade numérica e classificação.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
