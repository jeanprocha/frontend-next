"use client"

import { useMemo } from "react"
import { BriefingSectionTitle } from "@/components/shared/briefing-section-title"
import { RayXAnchorCallout } from "./ray-x-anchor-callout"
import { useCapability } from "@/features/plg"
import { formatArticleLabel, formatLegalCitationFromMetadata } from "@/lib/rag-metadata"
import { labelForChunkId } from "@/lib/law-document-labels"
import { cn } from "@/lib/utils"
import type { ClassificationItem, EvidenceArticle } from "@/types/api"

interface LawArticleIntegralProps {
  articleId: string | null
  classification?: ClassificationItem | null
}

function evidenceForArticle(
  c: ClassificationItem | null | undefined,
  articleId: string,
): EvidenceArticle | null {
  const list = c?.evidence
  if (!list?.length) return null
  const m = list.find((e) => e.article_id === articleId)
  return m ?? list[0] ?? null
}

/**
 * Liga o dispositivo indexado ao PDF oficial (DOU) na página e posição mapeadas — sem texto integral na app.
 */
export function LawArticleIntegral({
  articleId,
  classification = null,
}: LawArticleIntegralProps) {
  const rayxFull = useCapability("rayxFull")
  const articleLabel = useMemo(() => {
    if (!articleId) return ""
    const ev = evidenceForArticle(classification, articleId)
    return (
      formatLegalCitationFromMetadata(ev?.metadata, ev?.legal_path)?.trim() ||
      formatArticleLabel(articleId) ||
      articleId
    )
  }, [articleId, classification])

  if (!articleId) {
    return (
      <section className="mt-6 print:block">
        <BriefingSectionTitle>Texto oficial (PDF)</BriefingSectionTitle>
        <p className="text-sm text-muted-foreground print:block">
          Não há artigo indexado para esta linha — apenas a citação resumida em «Base legal».
        </p>
      </section>
    )
  }

  // Mesma fonte que articleLabel usa por baixo (via formatArticleLabel) — o
  // dispositivo citado e o documento no rótulo nunca podem divergir.
  const docLabel = labelForChunkId(articleId) || "corpus legal"

  return (
    <section className="mt-6 print:block">
      <BriefingSectionTitle>Texto oficial (PDF)</BriefingSectionTitle>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground print:block">
        Abra o PDF do Diário Oficial na página indexada para este <span className="font-mono">article_id</span>. O
        fragmento <span className="font-mono">#page=N</span> vem da ancoragem servida em{" "}
        <span className="font-mono">/law/articles/.../pdf-anchor</span> ({docLabel} no TribIA).
      </p>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground print:block">
        Dispositivo ({docLabel})
      </p>
      <div className="rounded-lg bg-muted/15 print:block">
        <RayXAnchorCallout
          chunkArticleId={articleId}
          compact
          leading={
            <p
              className={cn(
                "m-0 text-sm font-mono font-semibold leading-snug print:block",
                rayxFull ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
              )}
            >
              {articleLabel}
            </p>
          }
        />
      </div>
    </section>
  )
}
