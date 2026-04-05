"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PrintButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => window.print()}
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
