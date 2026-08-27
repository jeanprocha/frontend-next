"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { ClassificationBriefingContent } from "./classification-briefing-content"
import { BriefingSectionTitle } from "@/components/shared/briefing-section-title"
import { LawArticleIntegral } from "./law-article-integral"
import { LegalEvidenceHighlighter } from "@/components/shared/legal-evidence-highlighter"
import { RayXAnchorCallout } from "./ray-x-anchor-callout"
import { firstEvidenceWithContent, resolveLawArticleChunkId } from "@/lib/law-article-from-classification"
import { formatArticleLabel, formatLegalCitationFromMetadata } from "@/lib/rag-metadata"
import { useCapability } from "@/features/plg"
import { useTaxStore } from "@/store/useTaxStore"
import { cn } from "@/lib/utils"
import type { ClassificationItem } from "@/types/api"

const footerNote =
  "Fonte: classificação em lote e chunks do corpus legal no TribIA; sujeito a alterações legislativas."

const UNIFIED_PANEL_TITLE = "Cédula de auditoria"

/** Uma frase curta; em ecrãs estreitos o <p> usa line-clamp-2. */
const UNIFIED_PANEL_DESCRIPTION =
  "Classificação, evidências e texto legal remontados nesta simulação — não substitui o texto oficial consolidado."

/** Tipografia operacional (Geist); serif só com `board-ready:*` no documento. */
const ragBodyTypography =
  "font-sans text-sm leading-relaxed text-foreground/90 board-ready:font-board-report [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold"

function PanelChrome({
  title,
  description,
  rowKey,
  children,
  footer,
}: {
  title: string
  description: string
  rowKey: string
  children: ReactNode
  footer?: ReactNode
}) {
  const scrollBodyRef = useRef<HTMLDivElement>(null)

  const forwardWheelToBody = (e: React.WheelEvent) => {
    const el = scrollBodyRef.current
    if (!el) return
    e.preventDefault()
    el.scrollTop += e.deltaY
  }

  return (
    <div
      key={rowKey}
      className="flex min-h-0 max-h-[min(72vh,740px)] flex-col overflow-hidden"
    >
      <div
        className="shrink-0 border-b border-border/60 px-4 pb-3 pt-2 pr-10 text-left"
        onWheel={forwardWheelToBody}
      >
        <p className="font-heading text-lg font-medium tracking-tight text-foreground">{title}</p>
        <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{description}</p>
      </div>
      <div
        ref={scrollBodyRef}
        data-cedula-scroll
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4"
      >
        {children}
      </div>
      <div
        className="shrink-0 border-t border-border/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground"
        onWheel={forwardWheelToBody}
      >
        {footer ?? <p>{footerNote}</p>}
      </div>
    </div>
  )
}

/**
 * Secção lei integral / RAG. Raio-X Full (`LegalEvidenceHighlighter`) segue `useCapability("rayxFull")`
 * — mesmo contrato que `classification-briefing-content` e `context-hub` (tiers: docs/sistema-tiers-tribia.md).
 */
function LawArticleSection({ c }: { c: ClassificationItem }) {
  const chunkId = resolveLawArticleChunkId(c)
  const ev = firstEvidenceWithContent(c)
  const [ragOpen, setRagOpen] = useState(false)
  const rayxFull = useCapability("rayxFull")

  return (
    <div className="space-y-6 border-t border-border/50 pt-3">
      {chunkId ? (
        <LawArticleIntegral articleId={chunkId} classification={c} />
      ) : ev ? (
        <section>
          <BriefingSectionTitle>Trecho recuperado (RAG)</BriefingSectionTitle>
          {(() => {
            const trilha =
              formatLegalCitationFromMetadata(ev.metadata, ev.legal_path) || formatArticleLabel(ev.article_id)
            const chunkIdForPdf = ev.article_id?.trim() ?? ""
            return (
              <div className="mb-2 space-y-2 print:block">
                <div className="print:block">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground print:block">
                    Trilha normativa
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-mono text-xs font-semibold leading-snug print:block",
                      rayxFull
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground/90",
                    )}
                  >
                    {trilha}
                  </p>
                </div>
                {chunkIdForPdf ? (
                  <div className="rounded-lg border border-border/50 bg-muted/20 print:block">
                    <RayXAnchorCallout
                      chunkArticleId={chunkIdForPdf}
                      compact
                      leading={
                        <p className="m-0 text-xs text-muted-foreground print:block">
                          Abrir o PDF do DOU: salto <span className="font-mono">#page=…</span> a partir de{" "}
                          <span className="font-mono break-all">{chunkIdForPdf}</span>.
                        </p>
                      }
                    />
                  </div>
                ) : null}
              </div>
            )
          })()}
          <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5 print:block">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-fit px-2 text-xs font-medium text-primary hover:text-primary"
              aria-expanded={ragOpen}
              onClick={() => setRagOpen((o) => !o)}
            >
              {ragOpen ? "Ocultar texto" : "Ver texto"}
            </Button>
            {ragOpen ? (
              <>
                <div className="mt-2 border-t border-border/40 pt-3 print:block">
                  {rayxFull ? (
                    <LegalEvidenceHighlighter
                      text={ev.content}
                      snippets={ev.relevant_snippets}
                      tentative={ev.relevant_snippets_tentative}
                      enabled
                      proHighlight
                      className={ragBodyTypography}
                    />
                  ) : (
                    <div className={ragBodyTypography}>
                      <ReactMarkdown>{ev.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground print:block">
                  Sem identificador de chunk para remontar o artigo completo via API — mostramos o excerto devolvido pela
                  recuperação semântica desta linha.
                </p>
              </>
            ) : null}
          </div>
        </section>
      ) : (
        <section>
          <BriefingSectionTitle>Texto legal integral</BriefingSectionTitle>
          <p className="text-sm text-muted-foreground">
            Não há chunk indexado nem trecho RAG com texto para esta linha. O racional e a base legal da classificação
            encontram-se na secção acima.
          </p>
        </section>
      )}
    </div>
  )
}

/**
 * Cédula de auditoria: diagnóstico (IA), evidência RAG e dispositivo legal num único painel.
 * Sincroniza o Raio-X no ContextHub via matched_span ao montar.
 */
export function LineUnifiedEvidencePanel({ c, rowKey }: { c: ClassificationItem; rowKey: string }) {
  const setHighlight = useTaxStore((s) => s.setContextHighlightFromClassification)

  useEffect(() => {
    setHighlight(c)
    return () => setHighlight(null)
  }, [c, setHighlight])

  return (
    <PanelChrome title={UNIFIED_PANEL_TITLE} description={UNIFIED_PANEL_DESCRIPTION} rowKey={rowKey}>
      <ClassificationBriefingContent c={c} withClosingNote={false} />
      <LawArticleSection c={c} />
    </PanelChrome>
  )
}
