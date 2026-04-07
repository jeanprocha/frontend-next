"use client"

import type { ReactNode } from "react"
import { Plus } from "lucide-react"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

export interface EmptyStateBoxProps {
  title: string
  description: string
  ctaLabel: string
  onAction: () => void
  ariaLabel: string
  icon: ReactNode
  /** Ex.: selo “IA ativa” na zona de despesas */
  badge?: ReactNode
  /** Tecla global documentada em `constants/shortcuts.ts` (whisper-quiet ao lado do CTA). */
  shortcutKey?: string
  className?: string
}

/**
 * Convite técnico (Plano 04): tracejado, tokens semânticos, alvo de toque ≥44px no CTA.
 */
export function EmptyStateBox({
  title,
  description,
  ctaLabel,
  onAction,
  ariaLabel,
  icon,
  badge,
  shortcutKey,
  className,
}: EmptyStateBoxProps) {
  return (
    <button
      type="button"
      onClick={onAction}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex w-full min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-muted/20 p-10 text-center transition-[border-color,box-shadow,background-color] duration-300 sm:min-h-[280px] sm:p-12",
        "hover:border-emerald-500/30 hover:bg-muted/25 hover:shadow-[0_0_36px_-10px_rgba(16,185,129,0.14)]",
        "motion-reduce:transition-none motion-reduce:hover:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {badge}

      <div
        className={cn(
          "mb-5 flex size-16 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border transition-transform duration-200",
          "motion-safe:group-hover:scale-[1.03] motion-reduce:group-hover:scale-100",
        )}
        aria-hidden
      >
        {icon}
      </div>

      <div className="max-w-md space-y-2 px-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>

      <div
        className={cn(
          "mt-8 inline-flex min-h-11 min-w-[44px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground transition-colors",
          "group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-500",
        )}
      >
        <Plus className="size-3.5 shrink-0" aria-hidden />
        <span className="flex items-center gap-1.5">
          {ctaLabel}
          {shortcutKey ? (
            <Kbd className="border-primary-foreground/25 bg-primary-foreground/10 text-xs opacity-80">
              {shortcutKey}
            </Kbd>
          ) : null}
        </span>
      </div>
    </button>
  )
}
