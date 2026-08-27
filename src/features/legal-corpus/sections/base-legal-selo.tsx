"use client"

import { useLawCorpus } from "@/lib/use-law-corpus"
import { lawDocumentsCitedByRecord } from "@/lib/record-law-documents"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

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
 *
 * W1/Onda 2, PR 2: o documento exibido é o que ESTE registro citou (casado
 * pelo prefixo das âncoras de evidência, ver lib/record-law-documents.ts), não
 * o documento corrente do corpus. Antes desta mudança, o selo lia o corpus ao
 * vivo: no instante em que a LC 214/2025 virar corrente, todo dossiê salvo
 * passaria a afirmar "Base legal LC 214/2025" enquanto suas citações apontam
 * chunks lc68_. Registro sem evidência reconhecível → não afirma nada.
 */
function BaseLegalSeloSection({ record }: ReportSectionProps) {
  const { corpus, isLive } = useLawCorpus()
  const citados = lawDocumentsCitedByRecord(record, corpus.documents)

  if (!isLive || citados.length === 0) return null

  const texto =
    citados.length === 1
      ? `Base legal ${citados[0].label} atualizada em ${formatDataBase(citados[0].published_at)}`
      : `Base legal ${citados.map((d) => `${d.label} (${formatDataBase(d.published_at)})`).join(" + ")}`

  return (
    <p
      role="note"
      aria-label={texto}
      className="flex items-center gap-1.5 px-1 pb-2 text-[11px] leading-none text-muted-foreground"
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
      {citados.length === 1 ? (
        <>
          Base legal <span className="font-medium text-foreground">{citados[0].label}</span> atualizada em{" "}
          <span className="font-medium text-foreground">{formatDataBase(citados[0].published_at)}</span>
        </>
      ) : (
        <>
          Base legal{" "}
          <span className="font-medium text-foreground">
            {citados.map((d) => `${d.label} (${formatDataBase(d.published_at)})`).join(" + ")}
          </span>
        </>
      )}
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
