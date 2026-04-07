"use client"

import { useState } from "react"
import { ArrowRightLeft, Scale } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/api"
import { FISCAL_LAW_CHANGELOG, fiscalLawVersionLabel } from "@/lib/fiscal-law-changelog"
import type { SimulationResponse } from "@/types/api"
import type { TribiaPlgTier } from "@/lib/tribia-plg-flags"

function parseNet(s: string): string {
  const n = parseFloat(s)
  return Number.isFinite(n) ? n.toFixed(2) : s
}

/** Delta projetado − atual (negativo = economia). */
function simulationDeltaValue(sim: SimulationResponse): number {
  let deltaValue = parseFloat(sim.delta)
  const projNet = parseFloat(sim.projected.net_tax)
  const currNet = parseFloat(sim.current.net_tax)
  if (!Number.isFinite(deltaValue) && Number.isFinite(projNet) && Number.isFinite(currNet)) {
    deltaValue = projNet - currNet
  }
  return deltaValue
}

function singleVereditoSentence(sim: SimulationResponse): string {
  const deltaValue = simulationDeltaValue(sim)
  const neutral = !Number.isFinite(deltaValue) || deltaValue === 0
  const saving = deltaValue < 0
  const absDeltaStr = Math.abs(deltaValue).toFixed(2)
  if (neutral) {
    return "Não há variação material entre a carga líquida tributária atual estimada e a CBS/IBS projetada para o ano da simulação."
  }
  if (saving) {
    return `Economia potencial projetada de ${formatBRL(absDeltaStr)} na transição para CBS/IBS face ao quadro atual estimado.`
  }
  return `Custo adicional projetado de ${formatBRL(absDeltaStr)} na transição para CBS/IBS face ao quadro atual estimado.`
}

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
}: ComparisonVerdictCardProps) {
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

  const singleDelta = !isComparison ? simulationDeltaValue(currentSimulation) : 0
  const singleNeutral = !isComparison && (!Number.isFinite(singleDelta) || singleDelta === 0)
  const singleSaving = !isComparison && singleDelta < 0
  const singleAbsStr = !isComparison ? Math.abs(singleDelta).toFixed(2) : "0"

  return (
    <Card
      data-slot="card"
      className={cn(
        "relative overflow-hidden border-emerald-500/20 bg-white shadow-lg dark:bg-slate-950/40 dark:border-emerald-500/25",
        "board-ready:border board-ready:border-foreground/20 board-ready:shadow-none board-ready:dark:shadow-none",
        "print:border print:border-foreground/25 print:shadow-none tribia-print-flatten-shadow",
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-emerald-500/[0.06] blur-3xl dark:bg-emerald-500/10 board-ready:hidden print:hidden"
        aria-hidden
      />
      <CardContent className="relative z-10 space-y-6 p-6 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10 print:grid-cols-2">
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

            <p className="hidden text-xs font-medium uppercase tracking-wide text-muted-foreground board-ready:block print:block">
              Auditado via RAG Engine
            </p>
          </div>

          <div className="min-w-0 space-y-4">
            {isComparison ? (
              <>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 print:text-foreground">
                    Indicadores — cenário B vs A
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Diferença na carga líquida projetada (CBS/IBS)
                  </p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span
                      className={cn(
                        "font-sans text-3xl font-bold tabular-nums tracking-tight sm:text-4xl print:text-foreground",
                        neutral && "text-slate-700 dark:text-slate-200",
                        !neutral && savingVsA && "text-emerald-600 dark:text-emerald-400 print:!text-foreground",
                        !neutral && !savingVsA && "text-amber-600 dark:text-amber-400 print:!text-foreground",
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

                {accumulatedDiff !== null && Number.isFinite(accumulatedDiff) && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50 board-ready:rounded-lg board-ready:border-foreground/15 board-ready:bg-transparent print:rounded-lg print:border print:border-foreground/20 print:bg-transparent">
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
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50 board-ready:rounded-lg board-ready:border-foreground/15 board-ready:bg-transparent print:rounded-lg print:border print:border-foreground/20 print:bg-transparent">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans print:text-foreground">
                      CBS/IBS líquido projetado
                    </p>
                    <p className="mt-1 font-sans text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 print:text-foreground">
                      {formatBRL(parseNet(currentSimulation.projected.net_tax))}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50 board-ready:rounded-lg board-ready:border-foreground/15 board-ready:bg-transparent print:rounded-lg print:border print:border-foreground/20 print:bg-transparent">
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
