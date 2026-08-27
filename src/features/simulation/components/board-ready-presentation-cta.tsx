"use client"

import { ExternalLink, Loader2, Lock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BoardReadyPresentationCtaProps {
  /** Pro/Premium: acção de dossié desbloqueada. Free: só teaser. */
  unlocked: boolean
  /** A gerar o registo / abrir o dossié. */
  busy?: boolean
  /** Garantir registo, obter ID e abrir /report/[id] (Pro). */
  onDossier: () => void
  /** Free: abre sheet PRO — nunca gera o dossié. */
  onFreeTease: () => void
  /** Desactivado enquanto não há resultado. */
  disabled?: boolean
  className?: string
}

/**
 * CTA do dossié digital: grava a simulação (se necessário) e abre o relatório linear numa nova aba.
 */
export function BoardReadyPresentationCta({
  unlocked,
  busy = false,
  onDossier,
  onFreeTease,
  disabled = false,
  className,
}: BoardReadyPresentationCtaProps) {
  if (!unlocked) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy}
        onClick={onFreeTease}
        className={cn(
          "tribia-touch-target min-h-9 gap-1.5",
          "border-border/60 text-muted-foreground",
          "hover:border-emerald-500/40 hover:text-foreground",
          className,
        )}
        aria-label="Dossiê digital — disponível no plano Pro"
      >
        <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Dossiê</span>
        <span
          aria-hidden
          className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
        >
          Pro
        </span>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || busy}
      onClick={onDossier}
      className={cn(
        "gap-1.5 border-border/60",
        "hover:border-emerald-500/40 hover:text-emerald-900 dark:hover:text-emerald-100",
        "no-print print:hidden",
        className,
      )}
      aria-label="Gerar dossié digital e abrir em nova aba"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <span className="font-medium">
        <span className="hidden sm:inline">Gerar Dossiê digital</span>
        <span className="sm:hidden">Dossiê</span>
      </span>
    </Button>
  )
}
