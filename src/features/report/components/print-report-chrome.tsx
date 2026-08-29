"use client"

import { cn } from "@/lib/utils"
import { fiscalLawVersionLabel } from "@/lib/fiscal-law-changelog"
import { useLawCorpus } from "@/lib/use-law-corpus"

/**
 * Exportado (A5): `public-report.tsx` reusa este formatador para o subtítulo
 * do dossiê web — mesma data, mesmo formato do masthead de impressão, sem
 * duplicar a lógica.
 */
export function formatPrintDate(iso?: string | null): string {
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
  focusYear,
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
  /**
   * D2/Frente D — o ano de foco impresso precisa estar declarado na
   * identidade do documento; o controle canônico em si é print:hidden. O
   * selo "Ano de foco" do Veredito (financial-verdict-hero-card.tsx) já
   * cobre isto quando o veredito monta — esta linha é a rede de segurança
   * do masthead, sempre presente independente do estado do veredito.
   */
  focusYear?: number
}) {
  const hasContextId = Boolean(simulationContextLine?.trim())
  const hasScenario = Boolean(scenarioLine?.trim())
  const hasFocusYear = focusYear != null

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
                Diagnóstico da reforma tributária
              </span>
            </>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground space-y-0.5">
          <p>Relatório gerado em {formatPrintDate(generatedAtIso)}</p>
          {!whiteLabel && <p>Simulação processada pelo motor determinístico TribIA</p>}
        </div>
      </div>

      {/* Linha de identificação do cliente/cenário — paridade com o carimbo digital */}
      {(hasContextId || hasScenario || hasFocusYear) && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-xs text-foreground border-t border-foreground/20 pt-2">
          {hasContextId && (
            <span>
              <span className="font-semibold uppercase tracking-[0.1em] text-muted-foreground text-[10px]">
                Empresa{" "}
              </span>
              <span className="font-medium">{simulationContextLine}</span>
            </span>
          )}
          {hasContextId && (hasScenario || hasFocusYear) && (
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
          {hasScenario && hasFocusYear && (
            <span aria-hidden className="text-border/60">·</span>
          )}
          {hasFocusYear && (
            <span>
              <span className="font-semibold uppercase tracking-[0.1em] text-muted-foreground text-[10px]">
                Ano de foco{" "}
              </span>
              <span className="font-medium tabular-nums">{focusYear}</span>
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
  /** Override explícito; por omissão usa a versão ao vivo de useLawCorpus(). */
  lawVersion?: string
  /**
   * D3/Frente D — só no dossiê público (`mode === "public-linear"`,
   * ver rodape-legal.tsx): referência discreta de origem no papel, a URL
   * real da página (window.location), nunca um domínio fixo no código.
   */
  publicVerifyUrl?: string | null
}

/** Rodapé legal só na impressão — varia por plano e modo de simulação. */
export function PrintReportFooter({
  className,
  whiteLabel = false,
  freeWatermark = false,
  isComparing = false,
  lawVersion,
  publicVerifyUrl,
}: PrintReportFooterProps) {
  const { changelog } = useLawCorpus()
  const law = fiscalLawVersionLabel(lawVersion ?? changelog.version, changelog.label)
  const simLine = isComparing ? "Comparativo A/B (dois cenários)" : "Simulação única"
  const verifyLine = publicVerifyUrl ? (
    <p className="text-[10px] text-muted-foreground/70 font-sans break-all">
      Dossiê verificável em {publicVerifyUrl}
    </p>
  ) : null

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
          Classificação assistida por IA com evidência citada da lei
        </p>
        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-3xl mx-auto font-board-report">
          Documento confidencial. Simulação baseada na {changelog.label} e nos dados fornecidos. Não substitui parecer
          jurídico-contábil formal. Classificação assistida com recuperação legislativa e motor determinístico.
        </p>
        {verifyLine}
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
        <p className="text-xs font-medium text-muted-foreground font-sans">Auditado contra o texto da lei</p>
        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-3xl mx-auto font-board-report">
          O plano Free pode aplicar limites de precisão e de funcionalidades face aos planos pagos. Este relatório
          não substitui parecer jurídico-contábil formal.
        </p>
        {verifyLine}
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
      <p className="text-xs font-medium text-muted-foreground font-sans">Auditado contra o texto da lei</p>
      <p className="text-xs text-muted-foreground italic leading-relaxed max-w-3xl mx-auto font-board-report">
        O selo indica rastreabilidade de evidências legislativas no fluxo do simulador; não constitui certificação
        legal nem garantia de resultado fiscal. Este relatório é uma simulação baseada nas premissas da {changelog.label} e
        nos dados fornecidos pelo usuário. Não substitui parecer jurídico-contábil formal.
      </p>
      {verifyLine}
    </div>
  )
}
