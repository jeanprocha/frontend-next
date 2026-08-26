"use client"

import { cn } from "@/lib/utils"
import { FISCAL_LAW_CHANGELOG, fiscalLawVersionLabel } from "@/lib/fiscal-law-changelog"

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
  whiteLabel = false,
  clientBrandName,
  clientLogoUrl,
  simulationContextLine,
  scenarioLine,
}: {
  generatedAtIso?: string | null
  className?: string
  whiteLabel?: boolean
  clientBrandName?: string | null
  clientLogoUrl?: string | null
  /**
   * Identificação do cliente/empresa no papel — derivado da mesma heurística
   * do carimbo de sessão (sessionCompanyLabel) em page.tsx.
   * Fecha a lacuna: carimbo sticky é print:hidden; o PDF precisa desta linha.
   */
  simulationContextLine?: string | null
  /** Rótulo do cenário activo (simulação base, A/B, ano) — espelha o carimbo. */
  scenarioLine?: string | null
}) {
  const hasContextId = Boolean(simulationContextLine?.trim())
  const hasScenario = Boolean(scenarioLine?.trim())

  return (
    <div
      className={cn(
        "hidden print:flex print:flex-col print:gap-3 print:border-b-2 print:border-foreground print:pb-4 print:mb-8",
        className,
      )}
    >
      {/* Linha superior: marca + data */}
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-col gap-0.5">
          {whiteLabel && clientLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clientLogoUrl}
              alt=""
              className="max-h-12 max-w-[200px] object-contain object-left"
            />
          ) : whiteLabel && clientBrandName ? (
            <span className="font-board-report text-2xl font-bold tracking-tight text-foreground">
              {clientBrandName}
            </span>
          ) : (
            <>
              <span className="font-board-report text-2xl font-bold tracking-tight text-foreground">
                TribIA
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                Tax Intelligence Framework
              </span>
            </>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-0.5">
          <p>Relatório gerado em {formatPrintDate(generatedAtIso)}</p>
          {!whiteLabel && <p>Simulação processada pelo motor TribIA (backend Go)</p>}
        </div>
      </div>

      {/* Linha de identificação do cliente/cenário — paridade com o carimbo digital */}
      {(hasContextId || hasScenario) && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-xs text-foreground border-t border-foreground/20 pt-2">
          {hasContextId && (
            <span>
              <span className="font-semibold uppercase tracking-[0.1em] text-muted-foreground text-[10px]">
                Empresa{" "}
              </span>
              <span className="font-medium">{simulationContextLine}</span>
            </span>
          )}
          {hasContextId && hasScenario && (
            <span aria-hidden className="text-border/60">·</span>
          )}
          {hasScenario && (
            <span>
              <span className="font-semibold uppercase tracking-[0.1em] text-muted-foreground text-[10px]">
                Cenário{" "}
              </span>
              <span className="font-medium">{scenarioLine}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export interface PrintReportFooterProps {
  className?: string
  /** Premium: omitir menções directas à marca TribIA no rodapé. */
  whiteLabel?: boolean
  /** Free: rodapé sinaliza explicitamente o plano Free. */
  freeWatermark?: boolean
  /** True quando há comparativo A/B activo na vista impressa. */
  isComparing?: boolean
  /** Versão da lei (default changelog). */
  lawVersion?: string
}

/** Rodapé legal só na impressão — varia por plano e modo de simulação. */
export function PrintReportFooter({
  className,
  whiteLabel = false,
  freeWatermark = false,
  isComparing = false,
  lawVersion = FISCAL_LAW_CHANGELOG.version,
}: PrintReportFooterProps) {
  const law = fiscalLawVersionLabel(lawVersion)
  const simLine = isComparing ? "Comparativo A/B (dois cenários)" : "Simulação única"

  if (whiteLabel) {
    return (
      <div
        className={cn(
          "hidden print:block print:mt-16 print:border-t print:border-foreground/25 print:pt-4 print:text-center space-y-2",
          className,
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground font-sans tabular-nums">
          {law}
        </p>
        <p className="text-xs font-medium text-muted-foreground font-sans">{simLine}</p>
        <p className="text-[11px] text-muted-foreground/85 font-sans leading-relaxed max-w-3xl mx-auto">
          Auditoria legislativa assistida por IA (RAG)
        </p>
        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-3xl mx-auto font-board-report">
          Documento confidencial. Simulação baseada na LC 68/2024 e nos dados fornecidos. Não substitui parecer
          jurídico-contábil formal. Classificação assistida com recuperação legislativa e motor determinístico.
        </p>
      </div>
    )
  }

  if (freeWatermark) {
    return (
      <div
        className={cn(
          "hidden print:block print:mt-16 print:border-t print:border-foreground/25 print:pt-4 print:text-center space-y-2",
          className,
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground font-sans">
          Simulação TribIA Free
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground font-sans tabular-nums">
          {law}
        </p>
        <p className="text-xs font-medium text-muted-foreground font-sans">{simLine}</p>
        <p className="text-xs font-medium text-muted-foreground font-sans">Auditado via RAG Engine</p>
        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-3xl mx-auto font-board-report">
          O plano Free pode aplicar limites de precisão e de funcionalidades face aos planos pagos. Este relatório
          não substitui parecer jurídico-contábil formal.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "hidden print:block print:mt-16 print:border-t print:border-foreground/25 print:pt-4 print:text-center space-y-2",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground font-sans tabular-nums">
        {law}
      </p>
      <p className="text-xs font-medium text-muted-foreground font-sans">{simLine}</p>
      <p className="text-xs font-medium text-muted-foreground font-sans">Auditado via RAG Engine</p>
      <p className="text-xs text-muted-foreground italic leading-relaxed max-w-3xl mx-auto font-board-report">
        O selo indica rastreabilidade de evidências legislativas no fluxo do simulador; não constitui certificação
        legal nem garantia de resultado fiscal. Este relatório é uma simulação baseada nas premissas da LC 68/2024 e
        nos dados fornecidos pelo utilizador. Não substitui parecer jurídico-contábil formal.
      </p>
    </div>
  )
}
