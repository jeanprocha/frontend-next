"use client"

import type { ReactNode } from "react"
import { GlossaryHelpTrigger } from "@/components/tax/glossary-help-trigger"
import { TAX_GLOSSARY, type TaxGlossaryTerm } from "@/constants/tax-glossary"
import { cn } from "@/lib/utils"

interface TaxTermProps {
  term: TaxGlossaryTerm
  children?: ReactNode
}

export function TaxTerm({ term, children }: TaxTermProps) {
  const definition = TAX_GLOSSARY[term]

  return (
    <GlossaryHelpTrigger
      ariaLabel={`Definição: ${term}`}
      content={
        <p>
          <strong className="font-semibold text-foreground">{term}:</strong>{" "}
          <span className="text-muted-foreground">{definition}</span>
        </p>
      }
      contentClassName="max-w-[280px] p-3 text-xs leading-relaxed shadow-xl bg-popover text-popover-foreground border border-border"
      className={cn(
        "cursor-help border-b border-dotted border-muted-foreground/70",
        "hover:border-primary hover:text-primary transition-colors",
        "rounded-sm",
      )}
      preferSheetOnTouch={false}
    >
      {children ?? term}
    </GlossaryHelpTrigger>
  )
}
