import { ShieldCheck } from "lucide-react"
import { PrintReportFooter } from "../components/print-report-chrome"
import { useCapability } from "@/features/plg"
import { fiscalLawVersionLabel } from "@/lib/fiscal-law-changelog"
import { useLawCorpus } from "@/lib/use-law-corpus"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

/**
 * Fecho visível do dossiê (só web/board — a impressão tem o PrintReportFooter).
 * Achado do critique: a versão web terminava numa tabela, sem porta de saída —
 * o leitor sai do documento por um fecho institucional, não pelos fundos.
 * Honestidade: data-base e versão vêm do corpus vivo (useLawCorpus), nunca
 * de texto fixo; sem responsável técnico fabricado.
 */
function DossierClose({ whiteLabel, isComparing }: { whiteLabel: boolean; isComparing: boolean }) {
  const { changelog, isLive } = useLawCorpus()
  const simLine = isComparing ? "Comparativo A/B (dois cenários)" : "Simulação única"
  // Honestidade: a versão com data-base só é afirmada quando veio do servidor;
  // no fallback estático o fecho declara a origem local em vez de sumir.
  const lawLine = isLive
    ? `${fiscalLawVersionLabel(changelog.version, changelog.label)} · Auditado contra o texto da lei`
    : `${changelog.label} · versão de referência local`

  return (
    <section
      aria-label="Fecho do dossiê"
      className="mt-6 flex items-start gap-4 rounded-xl bg-tribia-navy-hero p-5 text-white sm:items-center print:hidden"
    >
      <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium tabular-nums">
          {lawLine} · {simLine}
        </p>
        <p className="text-xs leading-relaxed text-white/70">
          Este dossiê é uma simulação baseada nas premissas da {changelog.label} e nos dados fornecidos.
          Não substitui parecer jurídico-contábil formal.
        </p>
      </div>
      {!whiteLabel && (
        <span className="hidden shrink-0 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-400 sm:inline">
          TribIA · Dossiê de diagnóstico
        </span>
      )}
    </section>
  )
}

function RodapeLegalSection({ comparison, mode }: ReportSectionProps) {
  const whiteLabelExport = useCapability("whiteLabelExport")
  const freeWatermark = useCapability("freeWatermark")
  const isComparing = Boolean(comparison)
  // D3 — só no dossiê público o leitor do papel precisa de um caminho de
  // volta à fonte; no dashboard, window.location seria /simulador (exige
  // login, não mostra este registro sem estado) — não uma URL verificável.
  const publicVerifyUrl =
    mode === "public-linear" && typeof window !== "undefined" ? window.location.href : null
  return (
    <>
      {mode !== "screen-tabs" && <DossierClose whiteLabel={whiteLabelExport} isComparing={isComparing} />}
      <PrintReportFooter
        whiteLabel={whiteLabelExport}
        freeWatermark={freeWatermark}
        isComparing={isComparing}
        publicVerifyUrl={publicVerifyUrl}
      />
    </>
  )
}

export const rodapeLegalSection: ReportSection = {
  id: "rodape-legal",
  title: "Rodapé legal e fecho",
  print: "print-only",
  Component: RodapeLegalSection,
}
