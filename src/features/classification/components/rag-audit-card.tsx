"use client"



import { useState } from "react"

import { Sparkles } from "lucide-react"

import { ConfidenceGauge } from "@/components/shared/confidence-gauge"

import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { humanReviewHintFromAggregatedScore01 } from "@/lib/confidence-tiers"

import { cn } from "@/lib/utils"

import { ragScoreFormulaSummary } from "@/lib/rag-metadata"

import type { AiMetadata } from "@/types/api"



export interface RagAuditCardProps {

  aiMetadata: AiMetadata | null | undefined

  /** Abre o briefing do indicador RAG (ex.: store do painel de analista). */
  onOpenBriefing?: () => void

  className?: string

}



function HowCalculatedBody({ meta }: { meta: AiMetadata }) {

  const b = meta.breakdown

  const pct = (x: number) => `${Math.round(x * 100)}%`

  return (

    <div className="space-y-3 p-4 text-xs leading-relaxed">

      <div className="space-y-2 border-b border-border/60 pb-3">

        <p className="font-medium text-foreground">Fórmula da solidez (tese PRO)</p>

        <p className="text-muted-foreground">

          Demonstração = cálculo exato (motor determinístico) + fundamentação legal citada. O consultor permanece responsável pela

          tese perante o cliente; o TribIA fornece rastro auditável, não substituição pelo software.

        </p>

        <div className="grid gap-2 sm:grid-cols-2">

          <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-2">

            <p className="font-medium text-foreground">IA interpreta e contextualiza</p>

            <p className="mt-1 text-[11px] text-muted-foreground">

              Classificação semântica, recuperação de trechos da legislação vigente e linguagem de apoio — sem aritmética fiscal

              no domínio do motor.

            </p>

          </div>

          <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-2">

            <p className="font-medium text-foreground">O motor determinístico valida e calcula</p>

            <p className="mt-1 text-[11px] text-muted-foreground">

              Impostos, créditos, deltas e série 2026–2033 com regras determinísticas e precisão decimal no núcleo fiscal.

            </p>

          </div>

        </div>

      </div>



      <div className="space-y-2">

        <p className="font-medium text-foreground">Indicador agregado (camada ML)</p>

        <p className="text-muted-foreground">{ragScoreFormulaSummary()}</p>

        <p className="text-[11px] text-muted-foreground">

          Os percentuais abaixo medem aderência da evidência recuperada na lei e confiança média do classificador — não confundir

          com a «Fórmula da solidez» acima nem com certeza jurídica.

        </p>

        {b ? (

          <ul className="list-none space-y-1.5 text-muted-foreground">

            <li>

              Similaridade média com o texto legal (linhas com evidência):{" "}

              <span className="font-mono text-foreground">{pct(b.rag_similarity_mean)}</span>

            </li>

            <li>

              Confiança média do classificador: <span className="font-mono text-foreground">{pct(b.llm_confidence_mean)}</span>

            </li>

            <li>

              Cobertura de evidências: <span className="font-mono text-foreground">{pct(b.evidence_coverage)}</span>{" "}

              <span className="text-[11px]">

                ({b.with_evidence_count}/{b.classified_count} linhas)

              </span>

            </li>

          </ul>

        ) : (

          <p className="text-muted-foreground">

            Registro sem desagregado numérico; o percentual mostrado é o score consolidado armazenado.

          </p>

        )}

      </div>



      <p className="border-t border-border/60 pt-3 text-[11px] text-muted-foreground">

        <span className="font-medium text-foreground/90">IA explica</span> o nexo e a recuperação legislativa;{" "}

        <span className="font-medium text-foreground/90">Go calcula</span> impostos e deltas no motor. Este popover

        resume a análise semântica agregada — não substitui parecer fiscal.

      </p>

    </div>

  )

}



/**

 * Faixa compacta de fontes RAG (badges + popover «Como calculamos isto»).
 * Na UI principal: aba «Dados do cliente» da esteira (`audit-confidence-tabs`).

 */

/** Ordena dispositivos por número de artigo (numérico, não lexicográfico —
 *  "Art. 28" antes de "Art. 278"); sem número identificável, vai para o fim. */
function sortLegalSources(sources: string[]): string[] {
  const num = (s: string) => {
    const m = /\d+/.exec(s)
    return m ? Number.parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER
  }
  return [...sources].sort((a, b) => num(a) - num(b) || a.localeCompare(b, "pt-BR"))
}

/** Acima disto, a lista de fontes colapsa na tela (a impressão sai sempre completa). */
const SOURCES_COLLAPSE_AT = 12

export function RagAuditCard({ aiMetadata, onOpenBriefing, className }: RagAuditCardProps) {

  const [howOpen, setHowOpen] = useState(false)

  const [showAllSources, setShowAllSources] = useState(false)

  const score = aiMetadata?.confidence_score

  const reviewHint =
    score != null && Number.isFinite(score)
      ? humanReviewHintFromAggregatedScore01(score)
      : null



  if (!aiMetadata) {

    return (

      <div

        className={cn(

          "rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-3 text-xs text-muted-foreground",

          className,

        )}

      >

        <p className="font-medium text-foreground/80">Auditoria semântica</p>

        <p className="mt-1 leading-relaxed">

          Não há trechos da lei associados a esta simulação (ex.: registro antigo, ou a classificação por IA não

          encontrou evidência suficiente). Execute uma simulação manual com classificação por IA para ver

          relevância e fontes.

        </p>

      </div>

    )

  }



  const sources = sortLegalSources(aiMetadata.sources_analyzed)
  const visibleSources = showAllSources ? sources : sources.slice(0, SOURCES_COLLAPSE_AT)
  const collapsedCount = sources.length - visibleSources.length



  return (

    <div

      className={cn(

        "rounded-xl border border-emerald-200/50 bg-emerald-50/25 dark:border-emerald-500/20 dark:bg-emerald-950/20",

        "print:border print:border-foreground/25 print:bg-transparent print:!shadow-none",

        className,

      )}

    >

      <div className="flex flex-col gap-3 p-4">

        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">

          <Sparkles

            className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 board-ready:hidden print:hidden"

            aria-hidden

          />

          <span className="min-w-0 shrink text-xs font-bold uppercase tracking-wide text-emerald-900 dark:text-emerald-200 print:text-foreground">

            Fontes analisadas

          </span>

          <Popover open={howOpen} onOpenChange={setHowOpen}>

            <PopoverTrigger asChild>

              <Button

                type="button"

                variant="link"

                className="h-auto shrink-0 p-0 text-xs font-semibold uppercase tracking-wide text-emerald-800 underline-offset-2 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 board-ready:hidden print:hidden"

              >

                Como calculamos isto

              </Button>

            </PopoverTrigger>

            <PopoverContent align="start" className="w-[min(100vw-2rem,320px)] p-0">

              <HowCalculatedBody meta={aiMetadata} />

            </PopoverContent>

          </Popover>

        </div>

        <div className="flex flex-col gap-3 border-t border-emerald-200/40 pt-3 sm:flex-row sm:items-start sm:gap-4 dark:border-emerald-500/25">

          <div className="flex shrink-0 flex-col items-center gap-2 sm:items-start">

            <ConfidenceGauge

              score={score}

              onActivate={onOpenBriefing}

              className="border border-emerald-200/60 bg-white/60 p-2 dark:border-emerald-700/40 dark:bg-emerald-950/40"

            />

            {reviewHint ? (

              <p className="max-w-[220px] rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[11px] leading-snug text-amber-950 dark:text-amber-100">

                {reviewHint}

              </p>

            ) : null}

          </div>

          <div className="min-w-0 flex-1">

            {sources.length > 0 ? (

              <>
                {/* Tela: lista colapsada além de SOURCES_COLLAPSE_AT — o muro de
                    chips virava 3 telas no celular (achado do critique). */}
                <div className="flex flex-wrap content-start gap-1.5 print:hidden">
                  {visibleSources.map((source) => (
                    <Badge
                      key={source}
                      variant="outline"
                      className="h-auto min-h-5 max-w-full shrink items-start whitespace-normal border-emerald-200/80 bg-white/90 py-1 text-left text-xs font-medium leading-snug text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                    >
                      {source}
                    </Badge>
                  ))}
                </div>
                {collapsedCount > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowAllSources(true)}
                    className="mt-2 h-auto p-0 text-xs font-semibold text-emerald-800 underline-offset-2 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 print:hidden"
                  >
                    Mostrar os {sources.length} dispositivos citados
                  </Button>
                )}
                {collapsedCount === 0 && sources.length > SOURCES_COLLAPSE_AT && (
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowAllSources(false)}
                    className="mt-2 h-auto p-0 text-xs font-semibold text-emerald-800 underline-offset-2 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-emerald-100 print:hidden"
                  >
                    Mostrar menos
                  </Button>
                )}
                {/* Impressão: a lista completa sai sempre — conteúdo atrás de
                    interação não existe no papel. */}
                <div className="hidden print:flex print:flex-wrap print:content-start print:gap-1.5">
                  {sources.map((source) => (
                    <Badge
                      key={source}
                      variant="outline"
                      className="h-auto min-h-5 max-w-full shrink items-start whitespace-normal py-1 text-left text-xs font-medium leading-snug print:border-foreground/30 print:bg-transparent print:text-foreground"
                    >
                      {source}
                    </Badge>
                  ))}
                </div>
              </>

            ) : (

              <p className="text-xs leading-relaxed text-emerald-900/70 dark:text-emerald-200/70">

                Trechos sem identificador de artigo legível.

              </p>

            )}

          </div>

        </div>

      </div>

    </div>

  )

}

