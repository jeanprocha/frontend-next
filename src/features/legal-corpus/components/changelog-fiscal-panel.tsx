import { Scale, Zap } from "lucide-react"

import type { FiscalLawChangelogPayload } from "@/lib/fiscal-law-changelog"
import { cn } from "@/lib/utils"

/**
 * timeZone: "UTC" — o backend emite date.published_at como "YYYY-MM-DD" (meia-noite
 * UTC); sem isso, toLocaleDateString converte para o fuso local antes de formatar e
 * qualquer fuso negativo (Brasil, UTC-3) mostra o dia anterior (ver base-legal-selo.tsx).
 */
function formatChangelogDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
  } catch {
    return iso
  }
}

function typeLabel(type: "rule" | "ia"): string {
  return type === "rule" ? "Regra do motor" : "Classificação IA"
}

export function ChangelogFiscalPanel({
  data,
  embedded = false,
}: {
  data: FiscalLawChangelogPayload
  /** Lista sem teto de altura próprio — scroll no contentor pai (ex.: Sheet). */
  embedded?: boolean
}) {
  return (
    <div className={cn("flex flex-col", embedded && "min-h-0")}>
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Changelog fiscal</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{data.label} · v{data.version}</p>
        <p className="text-xs text-muted-foreground">{formatChangelogDate(data.date)}</p>
      </div>
      <ul
        className={cn(
          "divide-y divide-border/60 py-1",
          embedded ? "min-h-0 flex-1" : "max-h-[min(60vh,22rem)] overflow-y-auto",
        )}
      >
        {data.updates.map((u, i) => (
          <li key={`${u.label}-${i}`} className="flex gap-3 px-4 py-3">
            <span
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40"
              aria-hidden
            >
              {u.type === "rule" ? (
                <Scale className="size-4 text-foreground/80" strokeWidth={2} />
              ) : (
                <Zap className="size-4 text-accent" strokeWidth={2} />
              )}
            </span>
            <div className="min-w-0 max-w-prose flex-1 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {typeLabel(u.type)}
              </p>
              <p className="text-sm font-medium leading-snug text-foreground">{u.label}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{u.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="space-y-2 border-t border-border px-4 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Alterações em regras de negócio e na inteligência do sistema. O motor Go permanece determinístico por
          versão.
        </p>
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          Texto integral {data.label}
        </a>
      </div>
    </div>
  )
}
