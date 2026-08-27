"use client"

import { useLawCorpus } from "../use-law-corpus"
import type { ReportSection } from "@/lib/report-contract"

/**
 * O backend emite published_at como data pura "YYYY-MM-DD" (sem hora) —
 * new Date(...) interpreta isso como meia-noite UTC. Sem timeZone: "UTC"
 * aqui, toLocaleDateString converte para o fuso local do navegador antes de
 * formatar: em qualquer fuso negativo (Brasil, UTC-3) o dia exibido regride
 * um dia (22/07 vira 21/07). timeZone: "UTC" lê o calendário como o backend
 * quis dizer, e continua correto se um dia published_at virar timestamp completo.
 */
function formatDataBase(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    })
  } catch {
    return iso
  }
}

/**
 * PRODUCT.md: "a UI não deve exibir selos de atualização normativa que o
 * backend não sustenta" — só monta quando isLive (dado veio mesmo de
 * GET /law/corpus). Sem fallback visual: ausência é mais honesta que uma
 * data estática apresentada como se fosse ao vivo.
 */
function BaseLegalSeloSection() {
  const { changelog, isLive } = useLawCorpus()
  if (!isLive) return null

  const dataBase = formatDataBase(changelog.date)

  return (
    <p
      role="note"
      aria-label={`Base legal ${changelog.label} atualizada em ${dataBase}`}
      className="flex items-center gap-1.5 px-1 pb-2 text-[11px] leading-none text-muted-foreground"
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
      Base legal <span className="font-medium text-foreground">{changelog.label}</span> atualizada em{" "}
      <span className="font-medium text-foreground">{dataBase}</span>
    </p>
  )
}

export const baseLegalSeloSection: ReportSection = {
  id: "base-legal-selo",
  title: "Selo de base legal atualizada",
  print: "always",
  screenTab: "veredito",
  Component: BaseLegalSeloSection,
}
