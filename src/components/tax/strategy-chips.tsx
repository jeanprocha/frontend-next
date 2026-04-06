"use client"

import { useMemo } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { colorSchemeToChipClasses, normalizeText } from "@/lib/strategy-tags-match"
import type { StrategyTag } from "@/types/api"

interface StrategyChipsProps {
  text: string
  tags: StrategyTag[]
  /** Padrões já normalizados (normalizeText) recém-descobertos na sessão. */
  highlightPatterns?: readonly string[]
}

export function StrategyChips({ text, tags, highlightPatterns = [] }: StrategyChipsProps) {
  const reduceMotion = useReducedMotion() ?? false
  const highlightSet = useMemo(
    () => new Set(highlightPatterns.map((p) => normalizeText(p))),
    [highlightPatterns],
  )

  const activeRows = useMemo(() => {
    const normInput = normalizeText(text)
    const seenLabels = new Set<string>()
    const rows: { tag: StrategyTag; isNew: boolean }[] = []
    for (const t of tags) {
      const pn = normalizeText(t.pattern)
      if (!normInput.includes(pn)) continue
      if (seenLabels.has(t.label)) continue
      seenLabels.add(t.label)
      rows.push({ tag: t, isNew: highlightSet.has(pn) })
    }
    return rows
  }, [text, tags, highlightSet])

  return (
    <div className="mt-3 flex min-h-7 flex-wrap gap-2">
      <AnimatePresence mode="popLayout">
        {activeRows.map(({ tag, isNew }) => (
          <motion.div
            key={tag.label}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, scale: 0.8, y: 5 }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 28 }
            }
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight shadow-sm",
              colorSchemeToChipClasses(tag.color_scheme),
              isNew &&
                "ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/20 dark:ring-emerald-400/40 dark:shadow-emerald-900/30",
            )}
          >
            <Sparkles
              size={10}
              className={cn(!reduceMotion && "motion-safe:animate-pulse")}
              aria-hidden
            />
            {tag.label}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
