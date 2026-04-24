"use client"

import { buildLegalHighlightSegments } from "@/lib/legal-highlight-segments"
import { cn } from "@/lib/utils"

type Props = {
  text: string
  snippets?: string[] | null
  tentative?: string[] | null
  /** Quando false (ex.: Free), mostra só texto sem realce. */
  enabled: boolean
  className?: string
  /**
   * PRO / Raio-X Full: acento esmeralda institucional (`text-emerald-600`) e marcas alinhadas ao design system;
   * inclui `print:block` no realce nítido para o relatório PDF.
   */
  proHighlight?: boolean
}

/**
 * Realce cirúrgico sobre o texto legal do chunk: snippets fortes (emerald) e tentativos (sublinhado pontilhado).
 */
export function LegalEvidenceHighlighter({
  text,
  snippets,
  tentative,
  enabled,
  className,
  proHighlight = false,
}: Props) {
  const s = snippets?.filter(Boolean) ?? []
  const t = tentative?.filter(Boolean) ?? []
  if (!enabled || (s.length === 0 && t.length === 0)) {
    return <span className={className}>{text}</span>
  }

  const segs = buildLegalHighlightSegments(text, s, t)
  return (
    <span className={cn("leading-relaxed", className)}>
      {segs.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.value}</span>
        }
        if (seg.type === "strong") {
          return (
            <mark
              key={i}
              className={cn(
                "rounded-sm px-0.5 print:block",
                proHighlight
                  ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 print:bg-emerald-200/95 print:text-foreground"
                  : "bg-emerald-500/35 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-50 print:bg-emerald-200/95 print:text-foreground",
              )}
            >
              {seg.value}
            </mark>
          )
        }
        return (
          <mark
            key={i}
            className="rounded-sm bg-transparent px-0.5 text-foreground underline decoration-dotted decoration-amber-700/80 underline-offset-2 print:block dark:decoration-amber-500/80 print:decoration-foreground/60"
          >
            {seg.value}
          </mark>
        )
      })}
    </span>
  )
}
