import type { ReactNode } from "react"

/** Rótulo de secção alinhado ao padrão «Briefing de auditoria» (uppercase, traço inferior, contraste legível). */
export function BriefingSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 border-b border-border/50 pb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h3>
  )
}
