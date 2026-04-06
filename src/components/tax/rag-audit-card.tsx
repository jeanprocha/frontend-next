"use client"

import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ConfidenceGauge } from "@/components/tax/confidence-gauge"
import { cn } from "@/lib/utils"
import type { AiMetadata } from "@/types/api"

export interface RagAuditCardProps {
  aiMetadata: AiMetadata | null | undefined
  className?: string
}

/**
 * Painel de transparência RAG na vista de resultados (relevância + fontes citadas).
 */
export function RagAuditCard({ aiMetadata, className }: RagAuditCardProps) {
  if (!aiMetadata) {
    return (
      <div
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
      className={cn(
        "rounded-xl border border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-500/20 dark:bg-emerald-950/20",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-6">
        <ConfidenceGauge score={score} className="shrink-0 border-emerald-200/40 bg-white/60 dark:border-emerald-800/30 dark:bg-emerald-950/40" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-900 dark:text-emerald-200">
              Fontes analisadas
            </span>
          </div>
          {sources.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source) => (
                <Badge
                  key={source}
                  variant="outline"
                  className="border-emerald-200/80 bg-white/90 text-[9px] font-medium text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                >
                  {source}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-emerald-900/70 dark:text-emerald-200/70">
              Trechos recuperados sem identificador de artigo legível; o score acima reflete apenas a
              similaridade vetorial.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
