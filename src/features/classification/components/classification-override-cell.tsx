"use client"

import { memo, useCallback, useState } from "react"
import { Pencil, ShieldCheck, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { OverrideAuditTooltip } from "./override-audit-tooltip"
import { OverrideCommandContent } from "./override-command-content"
import {
  getEffectiveLabel,
  hasConsultantOverride,
  type OverrideOption,
} from "@/lib/classification-effective"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { cn } from "@/lib/utils"
import type { ClassificationItem, ConsultantClassificationOverride, FormExpense } from "@/types/api"

// Fallback de rótulo semântico (para o badge principal quando não há override).
function resolveSemanticLabelForAuditRow(c: ClassificationItem): string {
  if (c.error?.trim()) return "Erro na classificação"
  const base = c.legal_base?.trim()
  if (base) {
    return base.length > 32 ? `${base.slice(0, 30)}…` : base
  }
  return "Sem classificação"
}

/**
 * Badge de classificação com override (Mesa de operações): clique abre o
 * Command Smart List (popover no ponteiro, sheet no toque); Board-Ready
 * oculta a edição mas mantém o ShieldCheck + tooltip de auditoria.
 *
 * Isolado com memo + comparador de referência para evitar O(N) re-renders quando
 * qualquer override é aplicado: só a célula afectada deve re-renderizar.
 * Comparador verifica identity de classification (referência imutável no store)
 * e estabilidade dos callbacks (useCallback no pai garante refs estáveis).
 */
export const ClassificationOverrideCell = memo(
  function ClassificationOverrideCell({
    row,
    presentationMode,
    onApplyOverride,
    onRemoveOverride,
  }: {
    row: FormExpense & { classification: ClassificationItem | null }
    presentationMode: boolean
    onApplyOverride?: (clientId: string, override: ConsultantClassificationOverride) => void
    onRemoveOverride?: (clientId: string) => void
  }) {
  const [open, setOpen] = useState(false)
  const touchMeeting = useTouchMeetingMode()
  const c = row.classification

  const isOverridden = hasConsultantOverride(c)
  const effectiveLabel = c ? getEffectiveLabel(c) : null
  const legalLabel = c ? resolveSemanticLabelForAuditRow(c) : null
  const hasErr = Boolean(c?.error?.trim())

  const handleSelect = useCallback(
    (option: OverrideOption, justification: string) => {
      if (!onApplyOverride) return
      const clientId = row.id
      onApplyOverride(clientId, {
        is_eligible: option.is_eligible,
        regime_type: option.regime_type,
        justification: justification.trim() || undefined,
        overridden_at: new Date().toISOString(),
      })
    },
    [onApplyOverride, row.id],
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (onRemoveOverride) onRemoveOverride(row.id)
    },
    [onRemoveOverride, row.id],
  )

  if (!c) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  // ── Conteúdo do seletor ───────────────────────────────────────────────────
  const selectorContent = (
    <OverrideCommandContent
      classification={c}
      onSelect={handleSelect}
      onClose={() => setOpen(false)}
    />
  )

  // ── Badge visual ──────────────────────────────────────────────────────────
  const badgeEl = (
    <Badge
      variant="outline"
      className={cn(
        "max-w-[11rem] truncate font-normal transition-colors",
        isOverridden
          ? "border-emerald-500/60 bg-emerald-50/60 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-border/80 bg-muted/20 text-muted-foreground",
        hasErr &&
          "border-amber-300/60 bg-amber-50/40 text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-400",
        // Em operação, leve glow no hover para indicar interactividade
        !presentationMode && !hasErr && "cursor-pointer hover:border-border hover:bg-muted/40",
      )}
      title={isOverridden ? undefined : (c.legal_base ?? legalLabel ?? undefined)}
    >
      {isOverridden && (
        <ShieldCheck
          className="mr-1 size-3 shrink-0 text-emerald-500 dark:text-emerald-400"
          aria-hidden
        />
      )}
      {isOverridden ? effectiveLabel : legalLabel}
    </Badge>
  )

  // ── Board-Ready: sem edição, mas mantém ShieldCheck + tooltip ─────────────
  if (presentationMode) {
    if (!isOverridden) {
      return (
        <span className="inline-flex items-center gap-1">
          {badgeEl}
        </span>
      )
    }
    return (
      <Tooltip>
        <TooltipTrigger
          className="inline-flex cursor-default items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Classificação curada: ${getEffectiveLabel(c)}`}
        >
          {badgeEl}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[min(22rem,calc(100vw-2rem))] text-left"
        >
          <OverrideAuditTooltip
            classification={c}
            presentationMode={presentationMode}
          />
        </TooltipContent>
      </Tooltip>
    )
  }

  // ── Modo operacional: Popover (pointer) ou Sheet (touch) ──────────────────
  const triggerEl = isOverridden ? (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Classificação curada: ${effectiveLabel}. Clique para alterar`}
        onClick={() => setOpen(true)}
      >
        {badgeEl}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[min(22rem,calc(100vw-2rem))] text-left">
        <OverrideAuditTooltip classification={c} presentationMode={false} />
      </TooltipContent>
    </Tooltip>
  ) : (
    <button
      type="button"
      aria-label={`Classificação: ${legalLabel}. Clique para substituir`}
      aria-expanded={open}
      aria-haspopup="dialog"
      className="inline-flex items-center gap-1 rounded group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => setOpen(true)}
    >
      {badgeEl}
      <Pencil
        className="size-3 shrink-0 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-hidden
      />
    </button>
  )

  if (touchMeeting) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          aria-label={isOverridden
            ? `Curado: ${effectiveLabel}. Toque para alterar`
            : `Classificação: ${legalLabel}. Toque para substituir`}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="tribia-touch-target min-h-11 inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setOpen(true)}
        >
          {badgeEl}
          {!isOverridden && (
            <Pencil className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
          )}
        </button>
        {isOverridden && onRemoveOverride && (
          <button
            type="button"
            aria-label="Remover substituição"
            onClick={handleRemove}
            className="tribia-touch-target min-h-11 inline-flex size-8 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[min(85vh,580px)] overflow-y-auto rounded-t-2xl p-0"
            showCloseButton
          >
            <SheetHeader className="border-b border-border/60 px-4 py-3 text-left">
              <SheetTitle className="text-sm font-medium">
                Substituir classificação
              </SheetTitle>
              <p className="text-xs text-muted-foreground line-clamp-1">{row.description}</p>
            </SheetHeader>
            {selectorContent}
          </SheetContent>
        </Sheet>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {triggerEl}
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={6}
          className="w-[min(320px,calc(100vw-2rem))] p-0"
        >
          <div className="border-b border-border/60 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Substituir classificação
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {row.description}
            </p>
          </div>
          {selectorContent}
        </PopoverContent>
      </Popover>

      {isOverridden && onRemoveOverride && (
        <button
          type="button"
          aria-label="Remover substituição manual"
          onClick={handleRemove}
          className="inline-flex size-5 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </span>
  )
},
  (prev, next) =>
    prev.row.id === next.row.id &&
    prev.row.classification === next.row.classification &&
    prev.presentationMode === next.presentationMode &&
    prev.onApplyOverride === next.onApplyOverride &&
    prev.  onRemoveOverride === next.onRemoveOverride,
)
