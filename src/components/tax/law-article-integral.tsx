"use client"

import { useMemo } from "react"
import { BriefingSectionTitle } from "@/components/tax/briefing-section-title"
import { RayXAnchorCallout } from "@/components/tax/ray-x-anchor-callout"
import { useRayxFullAccess } from "@/hooks/use-tribia-plg-tier"
import { formatArticleLabel, formatLegalCitationFromMetadata } from "@/lib/rag-metadata"
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
  const rayxFull = useRayxFullAccess()
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

  return (
    <section className="mt-6 print:block">
      <BriefingSectionTitle>Texto oficial (PDF)</BriefingSectionTitle>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground print:block">
        Abra o PDF do Diário Oficial na página indexada para este <span className="font-mono">article_id</span>. O
        fragmento <span className="font-mono">#page=N</span> vem da ancoragem servida em{" "}
        <span className="font-mono">/law/articles/.../pdf-anchor</span> (LC 68 no TribIA).
      </p>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground print:block">
        Dispositivo (LC 68/2024)
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
