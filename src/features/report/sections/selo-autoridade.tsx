"use client"

import { Scale, ShieldCheck } from "lucide-react"
import { useLawCorpus } from "@/lib/use-law-corpus"
import { useEngineValidation } from "@/lib/use-engine-validation"
import { lawDocumentsCitedByRecord } from "@/lib/record-law-documents"
import { formatIsoDatePtBR } from "@/lib/format-iso-date-ptbr"
import { cn } from "@/lib/utils"
import type { ReportSection, ReportSectionProps, SimulationRecord } from "@/lib/report-contract"

/**
 * selo-autoridade.tsx — item A4 (Frente A, redesign do dossiê).
 *
 * Promove o antigo par de linhas de 11px (`base-legal-selo.tsx` +
 * `motor-validado-selo.tsx`, que somem em silêncio quando a API falha) a uma
 * única faixa navy de identidade — "o elemento que ninguém mais pode
 * afirmar" (base legal citada + motor validado contra a Calculadora RFB).
 *
 * HONESTIDADE POR METADE (tribia_core_rules §4): cada metade só afirma o que
 * estiver `isLive`; sem dado, a metade declara isso explicitamente — nunca
 * some, nunca fabrica data/versão. Por isso a faixa não retorna `null`: ao
 * contrário das duas seções antigas, ela sempre monta (mesmo com os dois
 * lados indisponíveis), porque a ausência também é uma afirmação que vale a
 * pena mostrar.
 *
 * Depende só de `lib/` (useLawCorpus, useEngineValidation,
 * lawDocumentsCitedByRecord, formatIsoDatePtBR) — nunca de
 * features/legal-corpus ou features/engine-validation (regra de fronteira:
 * feature não importa de outra feature).
 */

function BaseLegalHalf({ record, className }: { record: SimulationRecord; className?: string }) {
  const { corpus, isLive } = useLawCorpus()
  // W1/Onda 2: o documento afirmado é o que ESTE registro citou (casado pelo
  // prefixo das âncoras de evidência), não o corpus corrente — mesma lógica
  // de base-legal-selo.tsx, via o helper partilhado em lib/.
  const citados = isLive ? lawDocumentsCitedByRecord(record, corpus.documents) : []

  const value = !isLive
    ? "Selo de base legal indisponível nesta emissão"
    : citados.length === 0
      ? "Sem citação de base legal identificável neste registro"
      : citados.length === 1
        ? `${citados[0].label} · data-base ${formatIsoDatePtBR(citados[0].published_at)}`
        : citados.map((d) => `${d.label} (${formatIsoDatePtBR(d.published_at)})`).join(" + ")

  return (
    <div
      role="note"
      aria-label={`Base legal: ${value}`}
      className={cn("flex min-w-0 flex-1 items-center gap-3.5", className)}
    >
      <Scale
        className="size-5 shrink-0 text-emerald-400 print:text-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400 print:text-foreground/70">
          Base legal
        </p>
        <p className="text-sm font-medium text-white sm:truncate print:overflow-visible print:whitespace-normal print:text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

function MotorValidadoHalf({ className }: { className?: string }) {
  const { validation, isLive } = useEngineValidation()
  const versao = validation?.reference.version?.trim()

  if (!isLive || !validation || !versao) {
    return (
      <div
        role="note"
        aria-label="Motor validado: selo indisponível nesta emissão"
        className={cn("flex min-w-0 flex-1 items-center gap-3.5", className)}
      >
        <ShieldCheck
          className="size-5 shrink-0 text-emerald-400/60 print:text-foreground/60"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0 space-y-0.5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400 print:text-foreground/70">
            Motor validado
          </p>
          <p className="text-sm font-medium text-white/70 print:text-foreground/70">
            Selo de validação do motor indisponível nesta emissão
          </p>
        </div>
      </div>
    )
  }

  const dataExecucao = formatIsoDatePtBR(validation.reference.run_at)
  const escopo = validation.scope.join(" + ")
  const foraDoEscopo = validation.out_of_scope?.filter((s) => s.trim()) ?? []
  const divergencia =
    validation.cases_divergent === 0
      ? "divergência zero"
      : `${validation.cases_divergent} ${validation.cases_divergent === 1 ? "caso divergente" : "casos divergentes"}`
  const value = `${escopo} · Calculadora RFB ${versao} · ${validation.cases_total} ${validation.cases_total === 1 ? "caso" : "casos"}${dataExecucao ? ` · ${dataExecucao}` : ""} · ${divergencia}`

  return (
    <div
      role="note"
      aria-label={`Motor validado: ${value}`}
      className={cn("flex min-w-0 flex-1 items-center gap-3.5", className)}
    >
      <ShieldCheck
        className="size-5 shrink-0 text-emerald-400 print:text-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400 print:text-foreground/70">
          Motor validado
        </p>
        <p className="text-sm font-medium text-white sm:truncate print:overflow-visible print:whitespace-normal print:text-foreground">
          {value}
        </p>
        {foraDoEscopo.length > 0 && (
          <p className="text-[11px] leading-snug text-white/60 print:text-foreground/70">
            Não cobre: {foraDoEscopo.join(", ")}.
          </p>
        )}
      </div>
    </div>
  )
}

function SeloAutoridadeSection({ record }: ReportSectionProps) {
  return (
    <section
      aria-label="Selo de autoridade — base legal e motor validado"
      className={cn(
        "flex flex-col gap-4 rounded-xl bg-tribia-navy-hero px-5 py-4 text-white",
        "sm:flex-row sm:items-center sm:gap-6 sm:px-6",
        // P&B: a faixa precisa imprimir legível sem depender da cor navy/emerald.
        // print:flex-row explícito — não confiar no breakpoint sm: coincidir
        // com a largura assumida pelo motor de impressão.
        "print:flex-row print:items-center print:gap-6 print:rounded-lg print:border print:border-foreground/20 print:bg-transparent print:text-foreground",
      )}
    >
      <BaseLegalHalf record={record} />
      <div
        aria-hidden
        className="hidden h-10 w-px shrink-0 bg-white/15 sm:block print:block print:bg-foreground/20"
      />
      <MotorValidadoHalf className="border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0 print:border-t-0 print:pt-0" />
    </section>
  )
}

export const seloAutoridadeSection: ReportSection = {
  id: "selo-autoridade",
  title: "Selo de autoridade — base legal e motor validado",
  print: "always",
  screenTab: "veredito",
  Component: SeloAutoridadeSection,
}
