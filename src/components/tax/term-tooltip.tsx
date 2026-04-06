"use client"

import type { ReactNode } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "cursor-help border-b border-dashed border-muted-foreground/50 text-inherit",
          triggerClassName,
        )}
      >
        {term}
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-relaxed">
        {glossary[term] ?? children}
      </TooltipContent>
    </Tooltip>
  )
}
