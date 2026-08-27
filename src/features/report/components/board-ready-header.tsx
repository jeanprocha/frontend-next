"use client"

import { cn } from "@/lib/utils"
import { useLawCorpus } from "@/lib/use-law-corpus"

/** Relatório executivo: contexto longo vira linha curta (evita parecer “nome fantasia”). */
function truncateContext(s: string, max = 42): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}...`
}

export interface BoardReadyHeaderProps {
  /** Título principal do relatório */
  title?: string
  /** Contexto da empresa (não é razão social); vazio mostra placeholder */
  companyContext?: string | null
  /** Ano da simulação tributária */
  year: number
  /** ISO 8601 ou data já formatada; se omitido, usa `new Date()` */
  createdAtIso?: string | null
  className?: string
  /** Premium: substitui marca TribIA por logotipo / nome do cliente */
  whiteLabel?: boolean
  clientBrandName?: string | null
  clientLogoUrl?: string | null
}

function formatReportDate(iso?: string | null): string {
  if (iso) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function BoardReadyHeader({
  title = "Comparativo de impacto tributário",
  companyContext,
  year,
  createdAtIso,
  className,
  whiteLabel = false,
  clientBrandName,
  clientLogoUrl,
}: BoardReadyHeaderProps) {
  const { changelog } = useLawCorpus()
  const hasContext = Boolean(companyContext?.trim())
  const displayContext = hasContext
    ? truncateContext(companyContext!)
    : "Não informado — descreva o perfil na próxima simulação para contextualizar o relatório."

  return (
    <header
      className={cn(
        "hidden board-ready:block print:hidden border-b border-border pb-6 mb-6",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0 sm:max-w-[60%]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {changelog.label} — CBS / IBS
          </p>
          <h1 className="font-board-report text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground tabular-nums">
            Ano da simulação: <span className="font-medium text-foreground">{year}</span>
            {" · "}
            Gerado em {formatReportDate(createdAtIso)}
          </p>
        </div>
        <div className="shrink-0 text-right space-y-3 min-w-0 sm:max-w-[40%]">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold leading-none mb-1">
              Contexto da simulação
            </p>
            <p
              className="text-sm font-semibold text-foreground leading-snug break-words"
              title={hasContext ? companyContext!.trim() : undefined}
            >
              {displayContext}
            </p>
            {!hasContext && (
              <p className="text-xs text-muted-foreground mt-1 text-left sm:text-right">
                Texto livre do formulário; não substitui razão social.
              </p>
            )}
          </div>
          <div aria-hidden>
            {whiteLabel && clientLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clientLogoUrl}
                alt=""
                className="max-h-10 max-w-[140px] object-contain object-right ml-auto"
              />
            ) : whiteLabel && clientBrandName ? (
              <span className="inline-block text-lg font-semibold tracking-tight text-foreground font-board-report">
                {clientBrandName}
              </span>
            ) : (
              <>
                <span className="inline-block text-xl font-semibold tracking-tight text-primary font-serif">
                  TribIA
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Simulador de reforma tributária
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/** Marca d’água discreta; visível apenas em ecrã com ancestral `.board-ready` — propositadamente ausente da impressão (`print:hidden`). */
export function BoardReadyWatermark({
  visible = true,
  label = "Gerado por TribIA",
}: {
  visible?: boolean
  /** Free: incluir “Free” na etiqueta */
  label?: string
}) {
  if (!visible) return null
  return (
    <div
      className="hidden board-ready:flex print:hidden pointer-events-none fixed inset-0 z-[1] items-center justify-center overflow-hidden"
      aria-hidden
    >
      <span className="font-board-report select-none text-5xl sm:text-6xl md:text-7xl text-muted-foreground/[0.07] rotate-[-16deg]">
        {label}
      </span>
    </div>
  )
}
