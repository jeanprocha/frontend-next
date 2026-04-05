"use client"

import { cn } from "@/lib/utils"

function formatPrintDate(iso?: string | null): string {
  if (iso) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    }
  }
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

/** Masthead visível apenas na impressão (evita duplicar o BoardReadyHeader no papel). */
export function PrintReportHeader({
  generatedAtIso,
  className,
}: {
  generatedAtIso?: string | null
  className?: string
}) {
  return (
    <div
      className={cn(
        "hidden print:flex print:flex-row print:justify-between print:items-start print:border-b-2 print:border-foreground print:pb-4 print:mb-8",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-serif font-black tracking-tight text-foreground">
          TribIA
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          Tax Intelligence Framework
        </span>
      </div>
      <div className="text-right text-[10px] text-muted-foreground space-y-0.5">
        <p>Relatório gerado em {formatPrintDate(generatedAtIso)}</p>
        <p>Simulação processada pelo motor TribIA (backend Go)</p>
      </div>
    </div>
  )
}

/** Rodapé legal só na impressão. */
export function PrintReportFooter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "hidden print:block print:mt-16 print:border-t print:border-border print:pt-4 print:text-center",
        className,
      )}
    >
      <p className="text-[9px] text-muted-foreground italic leading-relaxed max-w-3xl mx-auto">
        Este relatório é uma simulação baseada nas premissas da LC 68/2024 e nos dados
        fornecidos pelo utilizador. Não substitui parecer jurídico-contábil formal.
      </p>
    </div>
  )
}
