"use client"

import type { ReactNode } from "react"
import { GlossaryHelpTrigger } from "@/components/shared/glossary-help-trigger"
import { TAX_GLOSSARY } from "@/constants/tax-glossary"
import { cn } from "@/lib/utils"

/**
 * Fonte única do glossário fiscal: TAX_GLOSSARY (constants/tax-glossary.ts) —
 * é a mesma usada por TaxTerm/parseTaxTerms no dossiê. Antes desta correção
 * (Etapa M/PR 2), este componente tinha um dicionário local com 3 termos
 * (IBS/CBS/Split Payment) e definições DIFERENTES das de TAX_GLOSSARY —
 * o mesmo termo explicado de dois jeitos, dependendo de qual componente
 * o usuário via.
 */

export function TermTooltip({
  term,
  children = null,
  triggerClassName,
}: {
  term: string
  children?: ReactNode
  triggerClassName?: string
}) {
  const body = (TAX_GLOSSARY as Record<string, string>)[term] ?? children
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
