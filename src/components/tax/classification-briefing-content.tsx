"use client"

import { useState } from "react"
import { BookMarked } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BriefingSectionTitle } from "@/components/shared/briefing-section-title"
import { LegalEvidenceHighlighter } from "@/components/shared/legal-evidence-highlighter"
import {
  confidenceTierBadgeClassName,
  confidenceTierFromScore01,
  confidenceTierShortLabel,
  isTenuousRagNexus,
  maxEvidenceSimilarity,
  TENUOUS_RAG_NEXUS_MESSAGE,
} from "@/lib/confidence-tiers"
import { formatArticleLabel, formatLegalCitationFromMetadata } from "@/lib/rag-metadata"
import { useCapability } from "@/features/plg"
import { cn } from "@/lib/utils"
import type { ClassificationItem } from "@/types/api"

export const BRIEFING_AUDITORIA_DESCRIPTION =
  "Nota técnica sintética — trilha entre o dado do cliente, a interpretação do modelo e a LC 68/2024."

function pct(x: number) {
  return `${Math.round(x * 100)}%`
}

/** Corpo do briefing por linha (popover IA, modal «Ver lei», sheet touch). */
export function ClassificationBriefingContent({
  c,
  withClosingNote = true,
}: {
  c: ClassificationItem
  /** Quando false, omitir nota final (ex.: antes de «Texto legal integral» no mesmo modal). */
  withClosingNote?: boolean
}) {
  const rayxFull = useCapability("rayxFull")
  const evidence = c.evidence ?? []
  const riskRaw = c.risk_level?.trim() || "—"
  const riskBadge = /risco/i.test(riskRaw) ? riskRaw : `Risco ${riskRaw}`
  const lineTier = confidenceTierFromScore01(c.confidence)
  const tenuousNexus = isTenuousRagNexus(maxEvidenceSimilarity(c))
  const [evidenceTextOpen, setEvidenceTextOpen] = useState<Record<string, boolean>>({})

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Badge
          className={cn(
            "border-transparent font-medium",
            c.is_eligible
              ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
              : "bg-amber-600/95 text-white hover:bg-amber-600/85",
          )}
        >
          {c.is_eligible ? "Elegível" : "Não elegível"}
        </Badge>
        <Badge className="border-transparent bg-foreground font-medium text-background hover:bg-foreground/90 dark:hover:bg-foreground/90">
          {riskBadge}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "font-medium tabular-nums",
            confidenceTierBadgeClassName(lineTier),
          )}
          title="Semáforo do classificador: sólido acima de 85%; revisar entre 60% e 85%; atípico abaixo de 60%."
        >
          Confiança {pct(c.confidence)} · {confidenceTierShortLabel(lineTier)}
        </Badge>
      </div>

      {tenuousNexus ? (
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
          {TENUOUS_RAG_NEXUS_MESSAGE}
        </div>
      ) : null}

      <div className="space-y-6 pt-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Instância</p>
          <p className="text-sm font-medium leading-snug text-foreground">{c.description || "—"}</p>
        </div>

        <section>
          <BriefingSectionTitle>Racional</BriefingSectionTitle>
          <p className="text-sm leading-relaxed text-foreground/90">
            {c.justification?.trim() || "Sem justificativa textual."}
          </p>
        </section>

        <section>
          <BriefingSectionTitle>Base legal</BriefingSectionTitle>
          <div className="rounded-lg bg-muted/20 text-sm leading-relaxed">
            <p className="text-foreground/90">
              {c.legal_base?.trim() || "Sem citação normativa consolidada neste item."}
            </p>
            {evidence.length > 0 ? (
              <ul className="mt-3 list-none space-y-2.5 pl-0 print:block">
                {evidence.slice(0, 8).map((evItem, evIndex) => {
                  const evKey = `${evItem.article_id}-${evIndex}`
                  const textOpen = Boolean(evidenceTextOpen[evKey])
                  const trilha =
                    formatLegalCitationFromMetadata(evItem.metadata, evItem.legal_path) ||
                    formatArticleLabel(evItem.article_id)
                  return (
                    <li
                      key={evKey}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-md border border-border/50 border-l-[3px] border-l-emerald-500/50 bg-background/40 py-2 pl-2.5 pr-2",
                      )}
                    >
                      <div className="print:block">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground print:block">
                          Trilha normativa
                        </p>
                        <div
                          className={cn(
                            "mt-0.5 inline-flex w-full max-w-full items-start gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 print:block",
                            rayxFull
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-emerald-950 dark:text-emerald-100",
                          )}
                        >
                          <BookMarked className="mt-0.5 size-3.5 shrink-0 font-sans opacity-80" aria-hidden />
                          <p className="m-0 min-w-0 break-words font-mono text-xs font-semibold leading-snug text-[inherit] print:block">
                            {trilha}
                          </p>
                        </div>
                      </div>
                      {Number.isFinite(evItem.similarity) || evItem.content ? (
                        <div className="flex min-h-7 items-center gap-2">
                          {Number.isFinite(evItem.similarity) ? (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              Similaridade {Math.round((evItem.similarity as number) * 100)}%
                            </span>
                          ) : null}
                          {evItem.content ? (
                            <>
                              <div className="min-w-0 flex-1" aria-hidden />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 shrink-0 px-2 text-xs font-medium text-primary hover:text-primary"
                                aria-expanded={textOpen}
                                onClick={() =>
                                  setEvidenceTextOpen((prev) => ({ ...prev, [evKey]: !prev[evKey] }))
                                }
                              >
                                {textOpen ? "Ocultar texto" : "Ver texto"}
                              </Button>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      {evItem.content && textOpen ? (
                        <span
                          className={cn(
                            "print:block",
                            "block text-xs text-muted-foreground",
                            rayxFull
                              ? "max-h-[min(42vh,22rem)] overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
                              : "max-h-[min(28vh,16rem)] overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]",
                          )}
                        >
                          <LegalEvidenceHighlighter
                            text={evItem.content}
                            snippets={evItem.relevant_snippets}
                            tentative={evItem.relevant_snippets_tentative}
                            enabled={rayxFull}
                            proHighlight={rayxFull}
                            className="text-xs text-muted-foreground"
                          />
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </section>
      </div>

      {withClosingNote ? (
        <div className="mt-6 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
          Evidências e percentagens vêm da classificação em lote desta simulação. Para o briefing agregado ou o Raio-X no
          contexto, use os controlos do painel principal.
        </div>
      ) : null}
    </>
  )
}
