"use client"

import { useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { runeIndicesToUtf16Offsets } from "@/lib/context-rune-span"

export interface ContextHighlightFieldProps {
  id: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  rows?: number
  className?: string
  highlightRuneRange: { start: number; end: number } | null
  /** Free: desfoca o trecho realçado (tease PLG). */
  teaseRayxHighlight?: boolean
  /** Liga o textarea ao callout Raio-X no Context Hub (quando o briefing está aberto). */
  ariaDescribedBy?: string
}

const fieldShell =
  "min-h-[72px] w-full resize-y rounded-lg border border-input px-2.5 py-2 text-sm outline-none transition-colors leading-normal font-sans"

export function ContextHighlightField({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  highlightRuneRange,
  teaseRayxHighlight = false,
  ariaDescribedBy,
}: ContextHighlightFieldProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hlRef = useRef<HTMLSpanElement>(null)

  const utf16 =
    highlightRuneRange != null
      ? runeIndicesToUtf16Offsets(value, highlightRuneRange.start, highlightRuneRange.end)
      : null

  const syncScroll = useCallback(() => {
    const b = backdropRef.current
    const t = textareaRef.current
    if (b && t) {
      b.scrollTop = t.scrollTop
      b.scrollLeft = t.scrollLeft
    }
  }, [])

  useEffect(() => {
    syncScroll()
  }, [value, syncScroll])

  useEffect(() => {
    if (!highlightRuneRange || !utf16 || utf16.start >= utf16.end) return
    const el = hlRef.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const idRaf = requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest",
      })
    })
    return () => cancelAnimationFrame(idRaf)
  }, [highlightRuneRange, utf16, value])

  const before = utf16 ? value.slice(0, utf16.start) : value
  const mid = utf16 && utf16.end > utf16.start ? value.slice(utf16.start, utf16.end) : ""
  const after = utf16 ? value.slice(utf16.end) : ""

  return (
    <div className={cn("relative min-h-[72px]", className)}>
      <div
        ref={backdropRef}
        className={cn(
          fieldShell,
          "pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words",
          "border-transparent bg-muted/25 text-foreground dark:bg-muted/20",
        )}
        aria-hidden
      >
        <span className="text-foreground">
          {before}
          {mid ? (
            <span
              ref={hlRef}
              className={cn(
                "rounded-sm bg-amber-200/90 dark:bg-amber-500/40",
                teaseRayxHighlight && "blur-[3px] opacity-70",
              )}
            >
              {mid}
            </span>
          ) : null}
          {after}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        aria-describedby={ariaDescribedBy}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        className={cn(
          fieldShell,
          "relative z-10 bg-transparent text-transparent caret-foreground",
          "placeholder:text-muted-foreground/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "selection:bg-primary/25 dark:bg-input/30",
        )}
      />
    </div>
  )
}
