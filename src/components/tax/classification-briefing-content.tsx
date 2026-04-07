"use client"

import { BookMarked } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BriefingSectionTitle } from "@/components/tax/briefing-section-title"
import { formatArticleLabel } from "@/lib/rag-metadata"
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
  const evidence = c.evidence ?? []
  const riskRaw = c.risk_level?.trim() || "—"
  const riskBadge = /risco/i.test(riskRaw) ? riskRaw : `Risco ${riskRaw}`

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
        <Badge variant="outline" className="font-medium tabular-nums text-foreground">
          Confiança {pct(c.confidence)}
        </Badge>
      </div>

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
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm leading-relaxed">
            <p className="text-foreground/90">
              {c.legal_base?.trim() || "Sem citação normativa consolidada neste item."}
            </p>
            {evidence.length > 0 ? (
              <ul className="mt-3 list-none space-y-2.5 pl-0">
                {evidence.slice(0, 8).map((evItem) => (
                  <li
                    key={evItem.article_id}
                    className="flex flex-col gap-1 border-l-2 border-emerald-500/45 pl-2.5"
                  >
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-950 dark:text-emerald-100">
                      <BookMarked className="size-3 shrink-0 opacity-80" aria-hidden />
                      {formatArticleLabel(evItem.article_id)}
                    </span>
                    {Number.isFinite(evItem.similarity) ? (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        Similaridade {Math.round((evItem.similarity as number) * 100)}%
                      </span>
                    ) : null}
                    {evItem.content ? (
                      <span className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                        {evItem.content}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <section>
          <BriefingSectionTitle>Análise de risco</BriefingSectionTitle>
          <p className="text-sm capitalize text-foreground/90">{riskRaw}</p>
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
