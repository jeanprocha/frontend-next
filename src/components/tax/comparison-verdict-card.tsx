"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { ArrowRightLeft, Scale, ShieldCheck } from "lucide-react"
import type { AuditTabValue } from "@/lib/simulation-esteira-types"
import { ConfidenceGauge } from "@/components/shared/confidence-gauge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/format-money"
import {
  confidenceTierFromScore01,
  confidenceTierShortLabel,
  humanReviewHintFromAggregatedScore01,
} from "@/lib/confidence-tiers"
import { FISCAL_LAW_CHANGELOG, fiscalLawVersionLabel } from "@/lib/fiscal-law-changelog"
import { heuristicRagHeroArticle } from "@/lib/rag-hero-article-heuristic"
import {
  parseNet,
  simulationDeltaValue,
  singleVereditoSentence,
} from "@/lib/simulation-verdict"
import { useTaxStore } from "@/store/useTaxStore"
import type { AiMetadata, ClassificationItem, SimulationResponse } from "@/types/api"
import type { TribiaPlgTier } from "@/lib/tribia-plg-flags"

function singleRacionalBody(lawLabel: string, ragSources?: string[] | null): string {
  const base = `A simulação assenta nas premissas do modelo TribIA para a ${lawLabel}, com regimes de transição e elegibilidade a créditos conforme o quadro legal aplicável (incluindo Art. 131 da LC 68/2024, no âmbito do modelo).`
  if (ragSources && ragSources.length > 0) {
    const list = ragSources.slice(0, 6).join(", ")
    const more = ragSources.length > 6 ? ` (+${ragSources.length - 6} outras)` : ""
    return `${base} Fontes legislativas priorizadas na recuperação RAG: ${list}${more}.`
  }
  return `${base} Sem lista de artigos consolidada neste registo — valide premissas com a área fiscal.`
}

export interface ComparisonVerdictCardProps {
  mode: "single" | "comparison"
  plgTier?: TribiaPlgTier
  strategyInsight?: string
  lawVersion?: string
  /** Sempre o cenário actual (B em modo comparison). */
  currentSimulation: SimulationResponse
  /** Modo comparison: cenário A. */
  baselineSimulation?: SimulationResponse
  /** Modo comparison: B − A em new_tax_net acumulado. */
  accumulatedDiff?: number | null
  /** Modo comparison: projected.net_tax B − A. */
  projectedNetDiff?: number
  /** Modo single: fontes RAG (ex. ai_metadata.sources_analyzed). */
  ragSources?: string[] | null
  layout?: "default" | "cockpit"
  onEsteiraTabChange?: (tab: AuditTabValue) => void
  aiMetadata?: AiMetadata | null
  classifications?: ClassificationItem[]
  expenses?: { id: string; amount: string }[]
  /** Conteúdo extra na coluna racional (ex. TribiaInsights). */
  insightSlot?: ReactNode
  /**
   * Quando true (layout cockpit, mode single), o parecer executivo (strategy_insight)
   * já está visível no VerdictThesisPanel (item 2.2.1).
   * Substitui o corpo de "A recomendação" por uma remissão curta ao painel
   * superior — evita duplicar o mesmo parágrafo LLM no dossiê.
   * (tribia_core_rules: "um protagonista por ideia")
   */
  executiveThesisDisplayed?: boolean
}

export function ComparisonVerdictCard({
  mode,
  plgTier = "free",
  strategyInsight,
  lawVersion = FISCAL_LAW_CHANGELOG.version,
  currentSimulation,
  baselineSimulation,
  accumulatedDiff = null,
  projectedNetDiff = 0,
  ragSources,
  layout = "default",
  onEsteiraTabChange,
  aiMetadata,
  classifications = [],
  expenses = [],
  insightSlot,
  executiveThesisDisplayed = false,
}: ComparisonVerdictCardProps) {
  const openMacroBriefing = useTaxStore((s) => s.openAnalystBriefingFromMacro)
  const [execTab, setExecTab] = useState<"veredito" | "parecer">("veredito")
  const showLegalTab = plgTier === "premium"
  const lawLabel = fiscalLawVersionLabel(lawVersion)

  const isComparison = mode === "comparison"
  const savingVsA = projectedNetDiff < 0
  const neutral =
    isComparison && (projectedNetDiff === 0 || !Number.isFinite(projectedNetDiff))
  const absProj = Math.abs(projectedNetDiff)
  const absProjStr = absProj.toFixed(2)

  const vereditoSentence = isComparison
    ? neutral
      ? "Não há diferença material na carga líquida projetada (CBS/IBS) entre o cenário B e a referência A."
      : savingVsA
        ? `Economia projetada de ${formatBRL(absProjStr)} na carga líquida CBS/IBS do cenário B face à referência A.`
        : `Custo adicional projetado de ${formatBRL(absProjStr)} na carga líquida CBS/IBS do cenário B face à referência A.`
    : singleVereditoSentence(currentSimulation)

  const racionalBody = isComparison
    ? `A simulação assenta nas premissas do modelo TribIA para a ${lawLabel}. A elegibilidade a créditos e regimes de transição seguem o quadro legal aplicável (incluindo Art. 131 da LC 68/2024, no âmbito do modelo).`
    : singleRacionalBody(lawLabel, ragSources)

  const recomendacao =
    strategyInsight?.trim() ||
    "Analise o detalhe das despesas e do perfil de regime tributário; valide premissas com a área fiscal antes de decisões estruturais."

  const showAbTable = isComparison && Boolean(baselineSimulation && currentSimulation)

  // Cockpit: faixa de delta no topo + Hero com o número; layout default: grelha de indicadores.
  const singleDelta = !isComparison ? simulationDeltaValue(currentSimulation) : 0
  const singleNeutral = !isComparison && (!Number.isFinite(singleDelta) || singleDelta === 0)
  const singleSaving = !isComparison && singleDelta < 0
  const singleAbsStr = !isComparison ? Math.abs(singleDelta).toFixed(2) : "0"

  const scrollToEsteira = () => {
    if (typeof document === "undefined") return
    document.getElementById("tribia-esteira-de-confianca")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  if (!isComparison && layout === "cockpit" && onEsteiraTabChange) {
    const heroPick = heuristicRagHeroArticle(expenses, classifications)
    const score01 = aiMetadata?.confidence_score
    const solidityTier =
      score01 != null && Number.isFinite(score01) ? confidenceTierFromScore01(score01) : null
    const solidityHint =
      score01 != null && Number.isFinite(score01) ? humanReviewHintFromAggregatedScore01(score01) : null
    const lawSeal = `Auditado via RAG Engine · LC 68/2024 v${lawVersion}`

    return (
      <Card
        data-slot="card"
        className={cn(
          "tribia-surface-verdict relative overflow-hidden",
          "board-ready:border board-ready:border-foreground/20 board-ready:shadow-none board-ready:ring-0 board-ready:dark:shadow-none",
          "print:border print:border-foreground/25 print:shadow-none print:ring-0 tribia-print-flatten-shadow",
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-500/[0.06] blur-3xl dark:bg-emerald-500/10 board-ready:hidden print:hidden"
          aria-hidden
        />
        <CardContent className="relative z-10 p-5 md:p-6 lg:p-7">
          {/* Protagonista do delta no resumo — espelha o Hero (emerald-600 p/ economia) */}
          <div
            className="mb-6 border-b border-border/50 pb-5 print:mb-4 print:border-foreground/20"
            aria-label="Variação da carga líquida CBS/IBS (projetado vs actual)"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-sans print:text-foreground/80">
              Impacto projectado (CBS/IBS)
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
              <span
                className={cn(
                  "font-sans text-3xl font-bold tabular-nums tracking-tight sm:text-4xl",
                  singleNeutral && "text-muted-foreground",
                  !singleNeutral && singleSaving && "text-emerald-600 dark:text-emerald-400",
                  !singleNeutral && !singleSaving && "text-amber-600 dark:text-amber-400",
                )}
              >
                {singleNeutral
                  ? formatBRL("0")
                  : `${singleSaving ? "−" : "+"}${formatBRL(singleAbsStr)}`}
              </span>
              {!singleNeutral && (
                <Badge
                  className={cn(
                    "border-0 px-2 py-0.5 text-xs font-semibold font-sans",
                    singleSaving && "bg-emerald-600 text-white hover:bg-emerald-600",
                    !singleSaving && "bg-amber-600 text-white hover:bg-amber-600",
                  )}
                >
                  {singleSaving ? "Economia projectada" : "Aumento de carga"}
                </Badge>
              )}
            </div>
          </div>
          <div
            className={cn(
              "grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)_minmax(0,0.95fr)] xl:gap-5 xl:items-start",
              "print:grid-cols-1 print:gap-4 board-ready:grid-cols-1 board-ready:gap-4",
            )}
          >
            {/*
             * Col A — Referência CBS/IBS.
             * O protagonista do delta (valor absoluto + %) foi movido para o
             * FinancialVerdictHeroCard (item 2.1.1) acima desta secção.
             * Esta coluna mantém os valores de referência absolutos (projetado vs atual)
             * para contextualizar o Racional e a Prova técnica.
             */}
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 print:border print:border-foreground/20 print:bg-transparent",
                  )}
                >
                  <Scale className="size-3.5" strokeWidth={2.5} aria-hidden />
                </div>
                <h3 className="font-board-report text-sm font-semibold tracking-tight text-foreground">
                  Referência CBS/IBS
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-xl border border-border/80 bg-muted/25 p-3 dark:bg-muted/40 board-ready:rounded-lg board-ready:border-foreground/15 board-ready:bg-transparent print:rounded-lg print:border print:border-foreground/20 print:bg-transparent">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans print:text-foreground">
                    CBS/IBS líquido projetado
                  </p>
                  <p className="mt-1 font-sans text-base font-bold tabular-nums text-slate-900 dark:text-slate-100 print:text-foreground">
                    {formatBRL(parseNet(currentSimulation.projected.net_tax))}
                  </p>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/25 p-3 dark:bg-muted/40 board-ready:rounded-lg board-ready:border-foreground/15 board-ready:bg-transparent print:rounded-lg print:border print:border-foreground/20 print:bg-transparent">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans print:text-foreground">
                    Quadro atual estimado
                  </p>
                  <p className="mt-1 font-sans text-base font-bold tabular-nums text-slate-900 dark:text-slate-100 print:text-foreground">
                    {formatBRL(parseNet(currentSimulation.current.net_tax))}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground font-sans">Ano {currentSimulation.year}</p>
                </div>
              </div>
            </div>

            {/* Col B — Racional */}
            <div className="min-w-0 space-y-4 border-y border-border/50 py-4 xl:border-x xl:border-y-0 xl:px-4 xl:py-0 print:border-0 print:px-0 print:py-0">
              {showLegalTab && (
                <div
                  className="flex rounded-lg border border-border/70 bg-muted/20 p-0.5 text-sm font-medium print:hidden"
                  role="tablist"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={execTab === "veredito"}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 transition-colors",
                      execTab === "veredito"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setExecTab("veredito")}
                  >
                    Veredito financeiro
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={execTab === "parecer"}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 transition-colors",
                      execTab === "parecer"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setExecTab("parecer")}
                  >
                    <Scale className="size-3 opacity-80" aria-hidden />
                    Parecer jurídico
                  </button>
                </div>
              )}

              <div
                className={cn(
                  "space-y-4",
                  showLegalTab && execTab === "parecer" && "hidden print:block",
                )}
              >
                <section className="space-y-1.5">
                  <h4 className="font-board-report text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    O veredito
                  </h4>
                  <p className="font-board-report text-sm leading-snug text-foreground md:text-base">{vereditoSentence}</p>
                </section>
                <section className="space-y-1.5 border-t border-border/50 pt-3">
                  <h4 className="font-board-report text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    O racional
                  </h4>
                  <p className="font-board-report text-xs leading-relaxed text-foreground/90 md:text-sm">{racionalBody}</p>
                </section>
                <section className="space-y-1.5 border-t border-border/50 pt-3">
                  <h4 className="font-board-report text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    A recomendação
                  </h4>
                  {executiveThesisDisplayed && !isComparison ? (
                    /* Remissão curta — evita duplicar o parecer executivo que já
                     * está no VerdictThesisPanel (Lado B) acima desta secção.
                     * Um protagonista por ideia (tribia_core_rules + system.md). */
                    <p className="font-board-report text-xs leading-relaxed text-muted-foreground md:text-sm">
                      O parecer executivo encontra-se no painel ao lado do veredito financeiro.
                    </p>
                  ) : (
                    <p className="font-board-report text-xs leading-relaxed text-foreground/90 md:text-sm">{recomendacao}</p>
                  )}
                </section>
                {insightSlot ? <div className="border-t border-border/50 pt-3">{insightSlot}</div> : null}
              </div>

              {showLegalTab && execTab === "parecer" && (
                <section className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4 text-sm leading-relaxed board-ready:border-foreground/15 print:border print:border-foreground/25">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rascunho assistido — Premium
                  </p>
                  <p className="font-board-report text-foreground/95">
                    Com base nos resultados simulados e nos artigos da LC 68/2024 recuperados pelo motor RAG, a linha de
                    defesa fiscal preliminar sustenta que a transição CBS/IBS deve ser interpretada em conjunto com o
                    regime de não-cumulatividade e com as exceções sectoriais aplicáveis ao perfil declarado. Este texto é
                    gerado de forma ilustrativa; exige revisão por profissional habilitado antes de qualquer uso perante
                    terceiros.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Pipeline futuro: LLM + revisão humana com trilho de citações por artigo.
                  </p>
                </section>
              )}

              <div className="hidden board-ready:block print:block space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Auditado via RAG Engine</p>
                {ragSources && ragSources.length > 0 ? (
                  <p className="max-w-prose text-xs leading-snug text-muted-foreground">
                    Citações normativas remontam a metadados determinísticos do índice legislativo (artigo, parágrafo,
                    inciso, alínea) quando o chunk estiver enriquecido após re-ingestão.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Col C — Prova técnica */}
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-2.5 py-2 dark:border-emerald-500/30 dark:bg-emerald-950/30 print:border-foreground/20 print:bg-transparent">
                <ShieldCheck className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
                <p className="text-[11px] font-semibold leading-snug text-emerald-950 dark:text-emerald-100 print:text-foreground">
                  {lawSeal}
                </p>
              </div>

              {heroPick ? (
                <div className="rounded-xl border border-border/70 bg-muted/15 px-3 py-2.5 dark:bg-muted/25">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Artigo de maior peso (RAG por linha)
                  </p>
                  <p className="mt-1 font-board-report text-sm font-semibold leading-snug text-foreground">
                    {heroPick.articleLabel}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    ~{heroPick.weightSharePct}% do peso agregado nas linhas com evidência (indicativo; não substitui
                    rateio do motor).
                  </p>
                </div>
              ) : null}

              <div className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2.5 dark:bg-muted/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Segurança jurídica (agregado)
                </p>
                {solidityTier && score01 != null ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5" role="img" aria-label={`Semáforo: ${solidityTier}`}>
                      <span
                        className={cn(
                          "size-2.5 rounded-full",
                          solidityTier === "green" && "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]",
                          solidityTier === "yellow" && "bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.35)]",
                          solidityTier === "red" && "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.35)]",
                        )}
                        aria-hidden
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {solidityTier === "green"
                          ? "Aderência sólida"
                          : solidityTier === "yellow"
                            ? "Revisão sugerida"
                            : confidenceTierShortLabel(solidityTier)}
                      </span>
                    </div>
                    {solidityHint ? (
                      <p className="w-full text-[11px] leading-snug text-muted-foreground">{solidityHint}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">Sem indicador agregado neste registo.</p>
                )}
              </div>

              <div className="flex justify-center print:hidden">
                <ConfidenceGauge
                  score={score01}
                  className="scale-95 border-border/50 p-3"
                  onActivate={
                    aiMetadata
                      ? () => {
                          onEsteiraTabChange("rag")
                          openMacroBriefing(aiMetadata)
                          scrollToEsteira()
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      data-slot="card"
      className={cn(
        "tribia-surface-verdict relative overflow-hidden",
        "board-ready:border board-ready:border-foreground/20 board-ready:shadow-none board-ready:ring-0 board-ready:dark:shadow-none",
        "print:border print:border-foreground/25 print:shadow-none print:ring-0 tribia-print-flatten-shadow",
        isComparison && "print:break-inside-avoid",
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-500/[0.06] blur-3xl dark:bg-emerald-500/10 board-ready:hidden print:hidden"
        aria-hidden
      />
      <CardContent className="relative z-10 space-y-6 p-6 md:p-8">
        {isComparison && (
          <div
            className="break-inside-avoid border-b border-border/50 pb-6 mb-2 print:mb-0 print:pb-5 print:border-foreground/20"
            aria-label="Delta da carga líquida projetada entre cenário B e referência A"
          >
            <p className="font-board-report text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground print:text-foreground/80">
              Delta B vs A
            </p>
            <p className="font-board-report mt-1.5 text-xs leading-snug text-muted-foreground max-w-prose">
              Carga líquida CBS/IBS projetada: diferença do cenário B face à referência A
            </p>
            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span
                className={cn(
                  "font-sans text-3xl font-bold tabular-nums tracking-tight sm:text-4xl print:text-foreground",
                  neutral && "text-muted-foreground",
                  !neutral && savingVsA && "text-emerald-600 dark:text-emerald-400",
                  !neutral && !savingVsA && "text-amber-600 dark:text-amber-400",
                )}
              >
                {neutral
                  ? formatBRL("0")
                  : `${savingVsA ? "−" : "+"}${formatBRL(absProjStr)}`}
              </span>
              {!neutral && (
                <Badge
                  className={cn(
                    "border-0 px-2 py-0.5 text-xs font-semibold font-sans print:border print:border-foreground print:bg-transparent print:text-foreground",
                    savingVsA && "bg-emerald-600 text-white hover:bg-emerald-600",
                    !savingVsA && "bg-amber-600 text-white hover:bg-amber-600",
                  )}
                >
                  {savingVsA ? "Menor carga em B" : "Maior carga em B"}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div
          className={cn(
            "grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10 print:grid-cols-2",
            isComparison && "print:gap-6",
          )}
        >
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 print:border print:border-foreground/20 print:bg-transparent",
                )}
              >
                {isComparison ? (
                  <ArrowRightLeft className="size-3.5" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Scale className="size-3.5" strokeWidth={2.5} aria-hidden />
                )}
              </div>
              <h3 className="font-board-report text-sm font-semibold tracking-tight text-foreground">
                Resumo executivo
              </h3>
            </div>

            {showLegalTab && (
              <div
                className="flex rounded-lg border border-border/70 bg-muted/20 p-0.5 text-sm font-medium print:hidden"
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={execTab === "veredito"}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 transition-colors",
                    execTab === "veredito"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setExecTab("veredito")}
                >
                  Veredito financeiro
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={execTab === "parecer"}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 transition-colors inline-flex items-center justify-center gap-1",
                    execTab === "parecer"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setExecTab("parecer")}
                >
                  <Scale className="size-3 opacity-80" aria-hidden />
                  Parecer jurídico
                </button>
              </div>
            )}

            <div
              className={cn(
                "space-y-5",
                showLegalTab && execTab === "parecer" && "hidden print:block",
              )}
            >
              <section className="space-y-1.5">
                <h4 className="font-board-report text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  O veredito
                </h4>
                <p className="font-board-report text-base leading-snug text-foreground">{vereditoSentence}</p>
              </section>

              <section className="space-y-1.5 border-t border-border/50 pt-4">
                <h4 className="font-board-report text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  O racional
                </h4>
                <p className="font-board-report text-sm leading-relaxed text-foreground/90">{racionalBody}</p>
              </section>

              <section className="space-y-1.5 border-t border-border/50 pt-4">
                <h4 className="font-board-report text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  A recomendação
                </h4>
                <p className="font-board-report text-sm leading-relaxed text-foreground/90">{recomendacao}</p>
              </section>
            </div>

            {showLegalTab && execTab === "parecer" && (
              <section className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4 text-sm leading-relaxed board-ready:border-foreground/15 print:border print:border-foreground/25">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rascunho assistido — Premium
                </p>
                <p className="font-board-report text-foreground/95">
                  Com base nos resultados simulados e nos artigos da LC 68/2024 recuperados pelo motor RAG, a linha de
                  defesa fiscal preliminar sustenta que a transição CBS/IBS deve ser interpretada em conjunto com o
                  regime de não-cumulatividade e com as exceções sectoriais aplicáveis ao perfil declarado. Este texto é
                  gerado de forma ilustrativa; exige revisão por profissional habilitado antes de qualquer uso perante
                  terceiros.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Pipeline futuro: LLM + revisão humana com trilho de citações por artigo.
                </p>
              </section>
            )}

            <div className="hidden board-ready:block print:block space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Auditado via RAG Engine</p>
              {ragSources && ragSources.length > 0 ? (
                <p className="text-xs text-muted-foreground leading-snug max-w-prose">
                  Citações normativas remontam a metadados determinísticos do índice legislativo (artigo, parágrafo,
                  inciso, alínea) quando o chunk estiver enriquecido após re-ingestão.
                </p>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            {isComparison ? (
              <>
                {accumulatedDiff !== null && Number.isFinite(accumulatedDiff) && (
                  <div className="rounded-2xl border border-border/80 bg-muted/25 p-4 dark:bg-muted/40 board-ready:rounded-lg board-ready:border-foreground/15 board-ready:bg-transparent print:rounded-lg print:border print:border-foreground/20 print:bg-transparent">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans print:text-foreground">
                      Diferença acumulada (2026–2033)
                    </p>
                    <p className="mt-1 font-sans text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 print:text-foreground">
                      {accumulatedDiff === 0
                        ? formatBRL("0")
                        : `${accumulatedDiff < 0 ? "−" : "+"}${formatBRL(Math.abs(accumulatedDiff).toFixed(2))}`}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground leading-snug font-sans">
                      Soma ano a ano da CBS/IBS projetada (new_tax_net): B − A nos anos em comum.
                    </p>
                  </div>
                )}

                {strategyInsight && (
                  <div className="flex items-start gap-2 px-0 board-ready:hidden print:hidden">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-sans">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Insight: </span>
                      {strategyInsight}
                    </p>
                  </div>
                )}

                {showAbTable && baselineSimulation && (
                  <div className="border-t border-border/60 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 font-sans">
                      Comparativo rápido
                    </p>
                    <table className="w-full text-xs font-sans tabular-nums border-collapse">
                      <thead>
                        <tr className="border-b border-border/80 text-left text-muted-foreground">
                          <th className="py-1.5 pr-2 font-medium">Métrica</th>
                          <th className="py-1.5 pr-2 font-medium">Referência A</th>
                          <th className="py-1.5 font-medium">Cenário B</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/40">
                          <td className="py-2 pr-2 text-muted-foreground">Líquido projetado</td>
                          <td className="py-2 pr-2 font-semibold">
                            {formatBRL(parseNet(baselineSimulation.projected.net_tax))}
                          </td>
                          <td className="py-2 font-semibold">
                            {formatBRL(parseNet(currentSimulation.projected.net_tax))}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 text-muted-foreground">Ano simulação</td>
                          <td className="py-2 pr-2">{baselineSimulation.year}</td>
                          <td className="py-2">{currentSimulation.year}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 print:text-foreground">
                    Indicadores — cenário simulado
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Variação da carga líquida CBS/IBS (projetado vs atual estimado)
                  </p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span
                      className={cn(
                        "font-sans text-3xl font-bold tabular-nums tracking-tight sm:text-4xl print:text-foreground",
                        singleNeutral && "text-slate-700 dark:text-slate-200",
                        !singleNeutral && singleSaving && "text-emerald-600 dark:text-emerald-400 print:!text-foreground",
                        !singleNeutral && !singleSaving && "text-amber-600 dark:text-amber-400 print:!text-foreground",
                      )}
                    >
                      {singleNeutral
                        ? formatBRL("0")
                        : `${singleSaving ? "−" : "+"}${formatBRL(singleAbsStr)}`}
                    </span>
                    {!singleNeutral && (
                      <Badge
                        className={cn(
                          "border-0 px-2 py-0.5 text-xs font-semibold font-sans print:border print:border-foreground print:bg-transparent print:text-foreground",
                          singleSaving && "bg-emerald-600 text-white hover:bg-emerald-600",
                          !singleSaving && "bg-amber-600 text-white hover:bg-amber-600",
                        )}
                      >
                        {singleSaving ? "Economia projetada" : "Aumento de carga"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/80 bg-muted/25 p-4 dark:bg-muted/40 board-ready:rounded-lg board-ready:border-foreground/15 board-ready:bg-transparent print:rounded-lg print:border print:border-foreground/20 print:bg-transparent">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans print:text-foreground">
                      CBS/IBS líquido projetado
                    </p>
                    <p className="mt-1 font-sans text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 print:text-foreground">
                      {formatBRL(parseNet(currentSimulation.projected.net_tax))}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-muted/25 p-4 dark:bg-muted/40 board-ready:rounded-lg board-ready:border-foreground/15 board-ready:bg-transparent print:rounded-lg print:border print:border-foreground/20 print:bg-transparent">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans print:text-foreground">
                      Quadro atual estimado
                    </p>
                    <p className="mt-1 font-sans text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 print:text-foreground">
                      {formatBRL(parseNet(currentSimulation.current.net_tax))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground font-sans">Ano {currentSimulation.year}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
