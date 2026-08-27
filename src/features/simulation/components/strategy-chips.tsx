"use client"

import { useEffect, useMemo, useRef } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  colorSchemeToChipClasses,
  matchActiveStrategyTags,
  normalizeText,
} from "@/lib/strategy-tags-match"
import { emitStrategyTagSuggested } from "../lib/strategy-tags-telemetry"
import { useTaxStore } from "@/store/useTaxStore"
import type { StrategyTag } from "@/types/api"

interface StrategyChipsProps {
  text: string
  tags: StrategyTag[]
  /** Padrões já normalizados (normalizeText) recém-descobertos na sessão. */
  highlightPatterns?: readonly string[]
  /** ID do elemento com a legenda (ex. Context Hub). */
  describedById?: string
}

const TITLE_KNOWN = "Abrir briefing — etiqueta do vocabulário TribIA"
const TITLE_NEW = "Abrir briefing — integrada após a última simulação"

export function StrategyChips({
  text,
  tags,
  highlightPatterns = [],
  describedById,
}: StrategyChipsProps) {
  const reduceMotion = useReducedMotion() ?? false
  const suggestedEmitted = useRef(new Set<string>())
  const openBriefing = useTaxStore((s) => s.openAnalystBriefingFromChip)

  const activeRows = useMemo(
    () => matchActiveStrategyTags(text, tags, highlightPatterns),
    [text, tags, highlightPatterns],
  )

  useEffect(() => {
    for (const { tag, isNew } of activeRows) {
      if (isNew) continue
      const pn = normalizeText(tag.pattern)
      if (!pn || suggestedEmitted.current.has(pn)) continue
      suggestedEmitted.current.add(pn)
      emitStrategyTagSuggested({
        pattern_key: pn,
        label_key: normalizeText(tag.label).slice(0, 64),
      })
    }
  }, [activeRows])

  return (
    <div
      className="mt-3 flex min-h-7 flex-wrap gap-2"
      role={describedById ? "group" : undefined}
      aria-describedby={describedById}
    >
      <AnimatePresence mode="popLayout">
        {activeRows.map(({ tag, isNew }) => {
          const rowKey = `${normalizeText(tag.pattern)}::${tag.label}`
          return (
            <motion.button
              type="button"
              key={rowKey}
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, scale: 0.96, y: 4 }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 420, damping: 32 }
              }
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-tight cursor-pointer text-left",
                isNew
                  ? cn(
                      colorSchemeToChipClasses(tag.color_scheme),
                      "shadow-md shadow-emerald-500/15 ring-2 ring-emerald-500/45 dark:ring-emerald-400/35",
                    )
                  : "border-border/80 bg-muted/35 text-foreground/90 shadow-none dark:border-border/60 dark:bg-muted/25",
              )}
              onClick={() => openBriefing(tag)}
              title={isNew ? TITLE_NEW : TITLE_KNOWN}
            >
              {isNew && (
                <Sparkles
                  size={10}
                  className={cn("shrink-0 text-emerald-600 dark:text-emerald-400", !reduceMotion && "motion-safe:animate-pulse")}
                  aria-hidden
                />
              )}
              {tag.label}
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
