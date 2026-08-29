"use client"

import { LegalEvidenceHighlighter } from "./legal-evidence-highlighter"
import { classificationErrorCellText } from "@/lib/classification-error-display"
import { firstEvidenceWithContent } from "@/lib/law-article-from-classification"
import { formatArticleLabel, formatLegalCitationFromMetadata } from "@/lib/rag-metadata"
import { useCapability } from "@/features/plg"
import { cn } from "@/lib/utils"
import type { ClassificationItem } from "@/types/api"

interface ExpenseCedulaDetailsProps {
  classification: ClassificationItem | null
  className?: string
}

/**
 * Porquê + citação da lei de uma linha da cédula — sempre montados no DOM,
 * nunca atrás de hover/clique (achado do critique: o porquê só existia num
 * tooltip de dot de 10px, quase inacessível no toque, e nunca imprimia).
 *
 * Usado na linha de detalhe da tabela (≥ sm / impressão) e no cartão mobile
 * — mesma fonte de verdade, sem duplicar JSX entre os dois gêmeos.
 *
 * "Sem citação": nunca inventamos trecho normativo quando o dado não existe
 * (regra do produto — "IA explica; Go calcula", nunca "IA inventa").
 */
export function ExpenseCedulaDetails({ classification: c, className }: ExpenseCedulaDetailsProps) {
  const rayxFull = useCapability("rayxFull")

  if (!c) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Sem classificação disponível para esta linha.
      </p>
    )
  }

  const errMsg = c.error?.trim()
  if (errMsg) {
    return (
      <p className={cn("text-xs text-destructive", className)} title={errMsg}>
        {classificationErrorCellText(errMsg)}
      </p>
    )
  }

  const justification = c.justification?.trim()
  const ev = firstEvidenceWithContent(c)
  const citationLabel = ev
    ? formatLegalCitationFromMetadata(ev.metadata, ev.legal_path) || formatArticleLabel(ev.article_id)
    : ""
  const similarityPct = ev && Number.isFinite(ev.similarity) ? Math.round(ev.similarity * 100) : null

  return (
    <div className={cn("space-y-2", className)}>
      <p className="line-clamp-2 text-xs leading-relaxed text-foreground print:line-clamp-none">
        <span className="font-semibold">Por que gera crédito: </span>
        {justification || "Sem justificativa registrada para esta linha."}
      </p>

      {ev ? (
        <div className="rounded-md border border-border/60 bg-muted/15 px-3 py-2 print:break-inside-avoid">
          <p className="font-board-report line-clamp-4 text-xs leading-relaxed text-foreground/90 italic print:line-clamp-none">
            &ldquo;
            <LegalEvidenceHighlighter
              text={ev.content}
              snippets={ev.relevant_snippets}
              tentative={ev.relevant_snippets_tentative}
              enabled={rayxFull}
              proHighlight={rayxFull}
            />
            &rdquo;
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="font-mono font-medium text-foreground">{citationLabel}</span>
            {similarityPct != null ? <span>aderência textual {similarityPct}%</span> : null}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Sem citação — nenhum trecho da lei foi recuperado para esta linha.
        </p>
      )}
    </div>
  )
}
