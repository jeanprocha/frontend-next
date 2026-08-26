"use client"

/**
 * Intent: consultor / CFO em auditoria; escaneia rapidamente quais linhas foram
 * validadas manualmente (ShieldCheck emerald) vs. só pela IA, e pode substituir
 * qualquer classificação sem reexecutar o batch RAG.
 *
 * Palette: Slate/Navy (fundo/texto) + Emerald-500 para override confirmado
 * (linguagem de "segurança jurídica" consistente com o veredito de solidez 2.3.2).
 * Sem emerald decorativo — só onde houver evento de auditoria.
 *
 * Depth: borders-only — densidade de ferramenta de auditoria.
 * Typography: Geist Sans (operação). font-board-report (serif) APENAS no
 * conteúdo do tooltip em presentationMode ("Validação humana realizada").
 * Spacing: múltiplos de 4px (base mental Tailwind).
 */

import { memo, useMemo, useState, useCallback } from "react"
import { Droplet, Pencil, ShieldCheck, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
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

import { ExpenseSemanticConfidenceDot } from "@/components/tax/expense-semantic-confidence-dot"
import { GlossaryHelpTrigger } from "@/components/tax/glossary-help-trigger"

import { formatBRL } from "@/lib/format-money"
import { findCreditLeakForRow } from "@/lib/credit-leak-match"
import {
  EXPENSE_OVERRIDE_OPTIONS,
  getAiSuggestedLabel,
  getEffectiveLabel,
  getEffectiveOption,
  hasConsultantOverride,
  type OverrideOption,
} from "@/lib/classification-effective"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { cn } from "@/lib/utils"
import type {
  ClassificationItem,
  ConsultantClassificationOverride,
  CreditLeak,
  FormExpense,
} from "@/types/api"

// ─── Fallback de rótulo semântico (para tooltip legal, não para o badge principal) ──

function resolveSemanticLabelForAuditRow(c: ClassificationItem): string {
  if (c.error?.trim()) return "Erro na classificação"
  const base = c.legal_base?.trim()
  if (base) {
    return base.length > 32 ? `${base.slice(0, 30)}…` : base
  }
  return "Sem classificação"
}

// ─── Conteúdo do tooltip de vazamento ────────────────────────────────────────

function LeakTooltipContent({ leak }: { leak: CreditLeak }) {
  const reason = leak.reason?.trim() || "—"
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-foreground">Custo não-recuperável</p>
      <p className="font-mono tabular-nums text-xs text-foreground">
        {formatBRL(leak.lost_credit)}
      </p>
      <p className="text-xs leading-snug text-muted-foreground">{reason}</p>
    </div>
  )
}

// ─── Tooltip de auditoria (rastro IA ↔ consultor) ─────────────────────────

function OverrideAuditTooltip({
  classification,
  presentationMode,
}: {
  classification: ClassificationItem
  presentationMode: boolean
}) {
  const aiLabel = getAiSuggestedLabel(classification)
  const effLabel = getEffectiveLabel(classification)
  const note = classification.consultant_override?.justification?.trim()
  const at = classification.consultant_override?.overridden_at

  return (
    <div className="space-y-1.5">
      {presentationMode ? (
        /*
         * Board-Ready: única linha em serif ("narrativa executiva").
         * Restante permanece Geist Sans.
         */
        <p className="font-board-report text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          Validação humana realizada
        </p>
      ) : (
        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="size-3" aria-hidden />
          Curado pelo consultor
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        <span className="text-foreground/80">Sugerido pela IA:</span>{" "}
        <span className="font-medium">{aiLabel}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="text-foreground/80">Definido pelo consultor:</span>{" "}
        <span className="font-medium text-foreground">{effLabel}</span>
      </p>
      {note && (
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-1.5 leading-snug">
          <span className="font-medium text-foreground/80">Nota do Especialista:</span> {note}
        </p>
      )}
      {at && (
        <p className="text-[10px] text-muted-foreground/60">
          {new Date(at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  )
}

// ─── Conteúdo do seletor de override (Command Smart List) ────────────────────

function OverrideCommandContent({
  classification,
  onSelect,
  onClose,
}: {
  classification: ClassificationItem
  onSelect: (option: OverrideOption, justification: string) => void
  onClose: () => void
}) {
  const [justification, setJustification] = useState(
    classification.consultant_override?.justification ?? "",
  )
  const [pendingOption, setPendingOption] = useState<OverrideOption | null>(null)

  const aiOption = useMemo(
    () => EXPENSE_OVERRIDE_OPTIONS.find(
      (o) => o.is_eligible === classification.is_eligible &&
             o.regime_type === classification.regime_type,
    ) ?? EXPENSE_OVERRIDE_OPTIONS[2],
    [classification.is_eligible, classification.regime_type],
  )

  // Opções do "corpo" = todas excluindo a sugestão IA (evita duplicata no grupo fixo)
  const bodyOptions = useMemo(
    () => EXPENSE_OVERRIDE_OPTIONS.filter((o) => o.valueKey !== aiOption.valueKey),
    [aiOption],
  )

  const effectiveOption = getEffectiveOption(classification)
  const selectedKey = pendingOption?.valueKey ?? effectiveOption.valueKey

  const handleSelect = useCallback(
    (opt: OverrideOption) => {
      if (opt.valueKey === selectedKey && !pendingOption) {
        // Clicar na opção já seleccionada sem mudança: apenas fechar
        onClose()
        return
      }
      setPendingOption(opt)
    },
    [selectedKey, pendingOption, onClose],
  )

  const handleApply = useCallback(() => {
    const opt = pendingOption ?? effectiveOption
    onSelect(opt, justification)
    onClose()
  }, [pendingOption, effectiveOption, justification, onSelect, onClose])

  return (
    <div className="flex flex-col gap-0">
      <Command className="rounded-none">
        <CommandInput
          placeholder="Pesquisar categoria…"
          className="h-9 text-sm"
          data-command-palette-ignore-hotkeys
        />
        <CommandList className="max-h-[220px]">
          {/* ── Slot fixo: sugestão da IA ── */}
          <CommandGroup heading="Sugestão do modelo">
            <CommandItem
              value={aiOption.valueKey}
              onSelect={() => handleSelect(aiOption)}
              className={cn(
                "gap-2 text-sm",
                selectedKey === aiOption.valueKey && "bg-muted/50 font-medium",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border/70",
                  selectedKey === aiOption.valueKey
                    ? "border-emerald-500 bg-emerald-500"
                    : "bg-background",
                )}
                aria-hidden
              />
              {aiOption.label}
              <span className="ml-auto text-[10px] text-muted-foreground">IA</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* ── Corpo: restantes opções (já ordenadas alfabeticamente) ── */}
          <CommandGroup heading="Todas as categorias">
            {bodyOptions.map((opt) => (
              <CommandItem
                key={opt.valueKey}
                value={opt.valueKey}
                onSelect={() => handleSelect(opt)}
                className={cn(
                  "gap-2 text-sm",
                  selectedKey === opt.valueKey && "bg-muted/50 font-medium",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border/70",
                    selectedKey === opt.valueKey
                      ? "border-emerald-500 bg-emerald-500"
                      : "bg-background",
                  )}
                  aria-hidden
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      {/* ── Justificativa + Aplicar ── */}
      <div className="border-t border-border/60 px-3 py-3 space-y-2">
        <textarea
          placeholder="Nota do especialista (opcional)"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          rows={2}
          data-command-palette-ignore-hotkeys
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 px-3 text-xs text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="h-8 px-3 text-xs"
            disabled={!pendingOption && !classification.consultant_override}
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ExpenseSemanticAuditTableProps {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
  creditLeaks?: CreditLeak[]
  presentationMode?: boolean
  ariaDescribedBy?: string
  /**
   * Chamado quando o consultor confirma um override.
   * clientId: id da despesa (FormExpense.id).
   */
  onApplyOverride?: (
    clientId: string,
    override: ConsultantClassificationOverride,
  ) => void
  /** Chamado quando o consultor remove um override (restaura sugestão IA). */
  onRemoveOverride?: (clientId: string) => void
}

// ─── Override popover/sheet por linha ────────────────────────────────────────

// Isolado com memo + comparador de referência para evitar O(N) re-renders quando
// qualquer override é aplicado: só a célula afectada deve re-renderizar.
// Comparador verifica identity de classification (referência imutável no store)
// e estabilidade dos callbacks (useCallback no pai garante refs estáveis).
const ClassificationOverrideCell = memo(
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

/** Célula do gauge (IA) + canal manual — repinta só quando a classificação da linha muda. */
const ClassificationSignalCell = memo(
  function ClassificationSignalCell({
    classification,
    presentationMode,
  }: {
    classification: ClassificationItem | null
    presentationMode: boolean
  }) {
    if (!classification) {
      return <span className="text-xs text-muted-foreground">—</span>
    }
    const hasErr = Boolean(classification.error?.trim())
    if (hasErr) {
      return <span className="text-xs text-muted-foreground">—</span>
    }
    return (
      <ExpenseSemanticConfidenceDot
        score={classification.confidence}
        justification={classification.justification}
        error={classification.error}
        presentationMode={presentationMode}
        hasConsultantOverride={hasConsultantOverride(classification)}
      />
    )
  },
  (prev, next) =>
    prev.classification === next.classification &&
    prev.presentationMode === next.presentationMode,
)

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Tabela compacta de rastreabilidade (item 3.1.1) + alerta de vazamento (3.3.1) +
 * mecânica de override manual (3.4.1).
 *
 * Prova o rastro: Descrição → Classificação (IA ou Consultor) → Valor.
 * Soberania do consultor: badge clicável → Smart List → ShieldCheck emerald.
 * Board-Ready: edição oculta; ShieldCheck + tooltip em serif permanecem.
 */
export function ExpenseSemanticAuditTable({
  expenses,
  classifications,
  creditLeaks,
  presentationMode = false,
  ariaDescribedBy,
  onApplyOverride,
  onRemoveOverride,
}: ExpenseSemanticAuditTableProps) {
  const hasLeakData = Boolean(creditLeaks?.length)

  const rows = useMemo(
    () =>
      expenses.map((exp) => ({
        ...exp,
        classification:
          classifications.find((c) => c.client_id === exp.id) ??
          classifications.find((c) => c.description === exp.description) ??
          null,
        leak: findCreditLeakForRow(creditLeaks, exp.description),
      })),
    [expenses, classifications, creditLeaks],
  )

  if (expenses.length === 0) {
    return (
      <div
        role="status"
        className="rounded-lg border border-border/60 bg-muted/15 px-4 py-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Nenhuma despesa detalhada nesta simulação.
        </p>
      </div>
    )
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border border-border/70"
      {...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {})}
    >
      <table className="w-full text-sm">
        <caption className="sr-only">
          Despesas e classificação semântica para rastreabilidade de auditoria. Coluna
          Sinal: confiança da análise IA; ícone de escudo quando a linha foi curada
          manualmente.
          {hasLeakData
            ? " Linhas com borda vermelha à esquerda indicam custo morto."
            : ""}
        </caption>

        <thead>
          <tr className="border-b border-border/70 bg-muted/30">
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Descrição
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Classificação
              {!presentationMode && (
                <span className="ml-1 font-normal normal-case tracking-normal text-[10px] text-muted-foreground/60">
                  (clique para substituir)
                </span>
              )}
            </th>
            <th
              scope="col"
              className="w-[1%] px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap"
            >
              Sinal
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground tabular-nums"
            >
              Valor (R$)
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const leak = row.leak
            const hasLeak = leak !== null

            return (
              <tr
                key={row.id}
                className={cn(
                  "group border-b border-border/60 last:border-0",
                  "transition-colors hover:bg-muted/20",
                  hasLeak
                    ? "border-l-2 border-l-[var(--tribia-verdict-increase-fg)]"
                    : "border-l-2 border-l-transparent",
                )}
              >
                {/* Descrição */}
                <td
                  className="max-w-[16rem] px-3 py-2 font-medium text-foreground"
                  title={row.description}
                >
                  <span className="line-clamp-1">{row.description}</span>
                </td>

                {/* Classificação + override */}
                <td className="px-3 py-2 text-center">
                  <ClassificationOverrideCell
                    row={row}
                    presentationMode={presentationMode}
                    onApplyOverride={onApplyOverride}
                    onRemoveOverride={onRemoveOverride}
                  />
                </td>

                <td className="px-2 py-2 text-center">
                  <ClassificationSignalCell
                    classification={row.classification}
                    presentationMode={presentationMode}
                  />
                </td>

                {/* Valor */}
                <td className="px-3 py-2 text-right">
                  <span className="inline-flex items-center justify-end gap-1.5">
                    {hasLeak && (
                      <GlossaryHelpTrigger
                        ariaLabel="Vazamento de crédito identificado nesta despesa"
                        sheetTitle="Custo não-recuperável"
                        content={<LeakTooltipContent leak={leak} />}
                        side="top"
                        preferSheetOnTouch
                        className="shrink-0"
                      >
                        <Droplet
                          className="size-3.5 text-[var(--tribia-verdict-increase-fg)]"
                          aria-hidden
                        />
                      </GlossaryHelpTrigger>
                    )}

                    {hasLeak && presentationMode && (
                      <span className="font-board-report text-[10px] text-[var(--tribia-verdict-increase-fg)] opacity-80 shrink-0">
                        Custo não-recuperável
                      </span>
                    )}

                    <span
                      className={cn(
                        "font-mono tabular-nums text-foreground",
                        presentationMode ? "font-semibold" : "font-medium",
                      )}
                    >
                      {formatBRL(row.amount)}
                    </span>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
