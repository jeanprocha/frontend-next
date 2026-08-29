import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  EXPENSE_OVERRIDE_OPTIONS,
  getEffectiveOption,
  type OverrideOption,
} from "@/lib/classification-effective"
import { cn } from "@/lib/utils"
import type { ClassificationItem } from "@/types/api"

/** Conteúdo do seletor de override (Command Smart List) — badge de classificação da Mesa. */
export function OverrideCommandContent({
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
