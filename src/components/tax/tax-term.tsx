"use client"

import type { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TAX_GLOSSARY, type TaxGlossaryTerm } from "@/constants/tax-glossary"
import { cn } from "@/lib/utils"

interface TaxTermProps {
  term: TaxGlossaryTerm
  children?: ReactNode
}

export function TaxTerm({ term, children }: TaxTermProps) {
  const definition = TAX_GLOSSARY[term]

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className={cn(
              "cursor-help border-b border-dotted border-muted-foreground/70",
              "hover:border-primary hover:text-primary transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
            )}
          />
        }
      >
        {children ?? term}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className={cn(
          "max-w-[280px] p-3 text-xs leading-relaxed shadow-xl",
          "bg-popover text-popover-foreground border border-border",
        )}
      >
        <p>
          <strong className="font-semibold text-foreground">{term}:</strong>{" "}
          <span className="text-muted-foreground">{definition}</span>
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
