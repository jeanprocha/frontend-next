"use client"

import { useMemo } from "react"
import { BriefingSectionTitle } from "@/components/tax/briefing-section-title"
import { RayXAnchorCallout } from "@/components/tax/ray-x-anchor-callout"
import { formatArticleLabel, formatLegalCitationFromMetadata } from "@/lib/rag-metadata"
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
  const articleLabel = useMemo(() => {
    if (!articleId) return ""
    const ev = evidenceForArticle(classification, articleId)
    return (
      formatLegalCitationFromMetadata(ev?.metadata)?.trim() ||
      formatArticleLabel(articleId) ||
      articleId
    )
  }, [articleId, classification])

  if (!articleId) {
    return (
      <section className="mt-6">
        <BriefingSectionTitle>Texto oficial (PDF)</BriefingSectionTitle>
        <p className="text-sm text-muted-foreground">
          Não há artigo indexado para esta linha — apenas a citação resumida em «Base legal».
        </p>
      </section>
    )
  }

  return (
    <section className="mt-6">
      <BriefingSectionTitle>Texto oficial (PDF)</BriefingSectionTitle>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Abra o PDF do Diário Oficial na página e posição correspondentes a este dispositivo (mapa LC 68 indexado no
        TribIA).
      </p>
      <div className="rounded-lg bg-muted/15">
        <RayXAnchorCallout
          chunkArticleId={articleId}
          compact
          leading={
            <p className="m-0 text-sm font-medium leading-snug text-foreground">{articleLabel}</p>
          }
        />
      </div>
    </section>
  )
}
