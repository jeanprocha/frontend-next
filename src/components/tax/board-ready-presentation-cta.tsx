"use client"

import { Lock, Monitor, Presentation, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BoardReadyPresentationCtaProps {
  /** Pro/Premium: modo está desbloqueado. Free: só teaser. */
  unlocked: boolean
  /** Board-Ready activo (só relevante quando `unlocked`). */
  active: boolean
  /** Callback para Pro: alterna modo apresentação. */
  onProToggle: () => void
  /** Callback para Free: abre teaser sheet — nunca activa o modo. */
  onFreeTease: () => void
  /** Desactivado durante loading ou sem resultado form. */
  disabled?: boolean
  className?: string
}

/**
 * CTA principal do modo apresentação Board-Ready.
 *
 * Três estados visuais — alinhados ao «Institucional Moderno» do system.md:
 *  - **Free (locked):** outline discreto com ícones Star+Lock; convite PRO
 *    *whisper-quiet*; clique abre `BoardReadyTeaseSheet`, nunca activa o modo.
 *  - **Pro — inactivo:** outline com ícone Presentation; hover emerald suave.
 *  - **Pro — activo:** emerald sólido (`bg-emerald-600`) com ícone Monitor; é
 *    o único CTA na barra que usa cor forte, coerente com «um só herói».
 *
 * A regra de interface: tipografia Serif (`font-board-report`) só é aplicada
 * pelo próprio modo `board-ready` nas secções de resultado — não neste botão.
 */
export function BoardReadyPresentationCta({
  unlocked,
  active,
  onProToggle,
  onFreeTease,
  disabled = false,
  className,
}: BoardReadyPresentationCtaProps) {
  // ── Free: Teaser PRO ──────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onFreeTease}
        className={cn(
          "tribia-touch-target min-h-9 gap-1.5",
          "border-border/60 text-muted-foreground",
          "hover:border-emerald-500/40 hover:text-foreground",
          className,
        )}
        aria-label="Modo apresentação — disponível no plano Pro"
      >
        <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Apresentação</span>
        <span
          aria-hidden
          className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
        >
          Pro
        </span>
      </Button>
    )
  }

  // ── Pro activo: emerald sólido — única cor forte na barra ─────────────────
  if (active) {
    return (
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={disabled}
        onClick={onProToggle}
        aria-pressed
        className={cn(
          "gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent",
          "no-print print:hidden",
          className,
        )}
      >
        <Monitor className="h-4 w-4 shrink-0" aria-hidden />
        <span>Modo edição</span>
      </Button>
    )
  }

  // ── Pro inactivo: outline whisper-quiet ───────────────────────────────────
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onProToggle}
      aria-pressed={false}
      className={cn(
        "gap-1.5 border-border/60",
        "hover:border-emerald-500/40 hover:text-emerald-900 dark:hover:text-emerald-100",
        "no-print print:hidden",
        className,
      )}
    >
      <Presentation className="h-4 w-4 shrink-0" aria-hidden />
      <span>Apresentação</span>
    </Button>
  )
}
