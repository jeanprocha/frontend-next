"use client"

import { useState } from "react"
import { buildLegalHighlightSegments, type LegalHighlightSegment } from "@/lib/legal-highlight-segments"
import { LegalEvidenceHighlighter } from "@/components/tax/legal-evidence-highlighter"
import { LawPdfOpenButton } from "@/components/tax/law-pdf-open-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  text: string
  snippets?: string[] | null
  tentative?: string[] | null
  /** Raio-X Full: realce; Free = texto integral sem colapso. */
  enabled: boolean
  className?: string
  /**
   * Com `pdfArticleId` (ex.: artigo herói): só trechos destacados + «Abrir no PDF oficial»; sem expandir texto no ecrã.
   */
  pdfArticleId?: string
}

function renderMark(seg: Exclude<LegalHighlightSegment, { type: "text" }>) {
  if (seg.type === "strong") {
    return (
      <mark className="rounded-sm bg-emerald-500/35 px-0.5 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-50 print:bg-emerald-200/95 print:text-foreground">
        {seg.value}
      </mark>
    )
  }
  return (
    <mark className="rounded-sm bg-transparent px-0.5 text-foreground underline decoration-dotted decoration-amber-700/80 underline-offset-2 dark:decoration-amber-500/80 print:decoration-foreground/60">
      {seg.value}
    </mark>
  )
}

/**
 * Por defeito mostra só os trechos com realce (snippets); «Ver texto» expande o artigo completo com o mesmo realce.
 * Com `pdfArticleId`, o PDF completa a leitura; não há «Ver texto completo».
 */
export function LegalEvidenceCollapsible({
  text,
  snippets,
  tentative,
  enabled,
  className,
  pdfArticleId,
}: Props) {
  const pdfMode = Boolean(pdfArticleId?.trim())
  const [showFull, setShowFull] = useState(false)

  const s = snippets?.filter(Boolean) ?? []
  const t = tentative?.filter(Boolean) ?? []

  if (!enabled || (s.length === 0 && t.length === 0)) {
    return <LegalEvidenceHighlighter text={text} snippets={snippets} tentative={tentative} enabled={enabled} className={className} />
  }

  const segs = buildLegalHighlightSegments(text, s, t)
  const highlightedOnly = segs.filter(
    (seg): seg is Exclude<LegalHighlightSegment, { type: "text" }> =>
      seg.type === "strong" || seg.type === "tentative",
  )

  const canCollapse = highlightedOnly.length > 0

  if (!canCollapse) {
    return (
      <div className={className}>
        <p className="text-[11px] text-muted-foreground">
          Trechos de realce não foram localizados no texto indexado; exibindo o conteúdo completo.
        </p>
        <LegalEvidenceHighlighter text={text} snippets={snippets} tentative={tentative} enabled={enabled} />
        {pdfMode ? (
          <div className="mt-2">
            <LawPdfOpenButton chunkArticleId={pdfArticleId!.trim()} />
          </div>
        ) : null}
      </div>
    )
  }

  /** Artigo herói: só destacados + PDF; impressão mantém texto completo. */
  if (pdfMode) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="print:hidden">
          <p className="font-board-report text-sm leading-relaxed text-foreground">
            {highlightedOnly.map((seg, i) => (
              <span key={i} className="inline">
                {i > 0 ? <span className="text-muted-foreground"> · </span> : null}
                {renderMark(seg)}
              </span>
            ))}
          </p>
          <div className="mt-2">
            <LawPdfOpenButton chunkArticleId={pdfArticleId!.trim()} />
          </div>
        </div>
        <div className="hidden print:block">
          <p className="font-board-report text-sm leading-relaxed text-foreground">
            <LegalEvidenceHighlighter text={text} snippets={snippets} tentative={tentative} enabled={enabled} />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="print:hidden">
        {showFull ? (
          <p className="font-board-report text-sm leading-relaxed text-foreground">
            <LegalEvidenceHighlighter text={text} snippets={snippets} tentative={tentative} enabled={enabled} />
          </p>
        ) : (
          <p className="font-board-report text-sm leading-relaxed text-foreground">
            {highlightedOnly.map((seg, i) => (
              <span key={i} className="inline">
                {i > 0 ? <span className="text-muted-foreground"> · </span> : null}
                {renderMark(seg)}
              </span>
            ))}
          </p>
        )}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-2 h-auto px-0 py-0 text-xs font-medium text-emerald-800 underline-offset-2 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
          onClick={() => setShowFull((v) => !v)}
          aria-expanded={showFull}
        >
          {showFull ? "Ver só o destacado" : "Ver texto"}
        </Button>
      </div>

      <div className="hidden print:block">
        <p className="font-board-report text-sm leading-relaxed text-foreground">
          <LegalEvidenceHighlighter text={text} snippets={snippets} tentative={tentative} enabled={enabled} />
        </p>
      </div>
    </div>
  )
}
