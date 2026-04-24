"use client"

import { ListOrdered } from "lucide-react"
import { cn } from "@/lib/utils"

export const AUDIT_TRAIL_STEPS: { label: string; detail: string; href: string }[] = [
  {
    label: "Veredito Executivo",
    detail: "Impacto financeiro imediato: delta de carga e tese de decisão.",
    href: "#veredito-executivo",
  },
  {
    label: "Cronograma de Impacto",
    detail: "Aritmética determinística e série 2026–2033 pelo motor Go.",
    href: "#tribia-journey-transicao",
  },
  {
    label: "Dossiê de Auditoria (RAG)",
    detail: "Certificado de cobertura, LC 68/2024 e prova documental para o CFO.",
    href: "#tribia-dossie-auditoria",
  },
  {
    label: "Mesa de Operações",
    detail: "Enquadramento semântico por linha (elegibilidade, regime e overrides).",
    href: "#tribia-mesa-operacoes",
  },
]

export function AuditTrailJourney({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-emerald-200/60 bg-white/50 px-3 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/25",
        "print:border-foreground/20 print:bg-transparent",
        className,
      )}
      aria-labelledby="tribia-audit-trail-title"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <ListOrdered className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
        <h3
          id="tribia-audit-trail-title"
          className="text-[11px] font-bold uppercase tracking-wide text-emerald-950 dark:text-emerald-100 print:text-foreground"
        >
          Jornada da auditoria
        </h3>
      </div>
      <ol className="list-none space-y-1.5 pl-0">
        {AUDIT_TRAIL_STEPS.map((s, i) => (
          <li key={s.href} className="flex gap-2 text-[11px] leading-snug">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 font-mono text-[10px] font-semibold text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200 print:bg-muted print:text-foreground"
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <a
                href={s.href}
                className="font-semibold text-emerald-900 underline-offset-2 hover:underline dark:text-emerald-100 print:text-foreground print:no-underline"
              >
                {s.label}
              </a>
              <span className="text-muted-foreground"> — {s.detail}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
