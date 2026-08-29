"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PrintButtonProps {
  className?: string
  /**
   * D3/Frente D — de qualquer superfície (abas ou apresentação), o impresso
   * é o documento completo: o chamador passa
   * use-print-full-document.ts em vez de window.print() cru, que ativa a
   * composição completa antes de imprimir. Sem onPrint, cai no
   * window.print() direto (uso já em modo apresentação).
   */
  onPrint?: () => void
}

export function PrintButton({ className, onPrint }: PrintButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => (onPrint ? onPrint() : window.print())}
      className={cn(
        "no-print print:hidden gap-2 bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:scale-[1.02] transition-transform",
        className,
      )}
    >
      <Printer className="h-4 w-4 shrink-0" aria-hidden />
      Gerar relatório PDF
    </Button>
  )
}
