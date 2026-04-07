"use client"

import type { ReactNode } from "react"
import { GlossaryHelpTrigger } from "@/components/tax/glossary-help-trigger"
import { cn } from "@/lib/utils"

const glossary: Record<string, string> = {
  IBS: "Imposto sobre Bens e Serviços — tributo estadual/municipal criado pela reforma tributária (LC 68/2024) que substituirá ICMS e ISS.",
  CBS: "Contribuição sobre Bens e Serviços — tributo federal que substituirá PIS e COFINS a partir de 2026.",
  "Split Payment":
    "Mecanismo automático de pagamento fracionado: o tributo é retido diretamente na transação financeira, sem passar pelo caixa do fornecedor.",
}

export function TermTooltip({
  term,
  children = null,
  triggerClassName,
}: {
  term: string
  children?: ReactNode
  triggerClassName?: string
}) {
  const body = glossary[term] ?? children
  return (
    <GlossaryHelpTrigger
      ariaLabel={`Definição: ${term}`}
      content={body}
      contentClassName="max-w-64 text-xs leading-relaxed"
      className={cn(
        "cursor-help border-b border-dashed border-muted-foreground/50 text-inherit",
        triggerClassName,
      )}
      preferSheetOnTouch={false}
    >
      {term}
    </GlossaryHelpTrigger>
  )
}
