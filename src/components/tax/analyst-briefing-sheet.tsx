"use client"

import Link from "next/link"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button"
import { BriefingSectionTitle } from "@/components/tax/briefing-section-title"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import { useRayxFullAccess } from "@/hooks/use-tribia-plg-tier"
import { ragScoreFormulaSummary } from "@/lib/rag-metadata"

export function AnalystBriefingSheet() {
  const open = useTaxStore((s) => s.analystBriefingOpen)
  const kind = useTaxStore((s) => s.analystBriefingKind)
  const tag = useTaxStore((s) => s.analystBriefingTag)
  const classification = useTaxStore((s) => s.analystBriefingClassification)
  const aiMeta = useTaxStore((s) => s.analystBriefingAiMeta)
  const close = useTaxStore((s) => s.closeAnalystBriefing)
  const fullRayx = useRayxFullAccess()

  const onOpenChange = (next: boolean) => {
    if (!next) close()
  }

  const title =
    kind === "macro" && aiMeta
      ? "Indicador RAG agregado"
      : kind === "chip" && tag
        ? tag.label
        : kind === "classification" && classification
          ? classification.description
          : "Briefing técnico"

  const pct = (x: number) => `${Math.round(x * 100)}%`

  const rational =
    kind === "macro" && aiMeta
      ? (() => {
          const b = aiMeta.breakdown
          const formula = ragScoreFormulaSummary()
          if (!b) {
            return (
              `Score global ${pct(aiMeta.confidence_score)}. ${formula} ` +
              "Valores históricos podem não incluir o detalhe numérico — execute nova simulação para ver o desagregado."
            )
          }
          return (
            `Score global ${pct(aiMeta.confidence_score)}. ${formula} ` +
            `Nesta simulação: similaridade RAG média (linhas com evidência) ${pct(b.rag_similarity_mean)}; ` +
            `confiança média do classificador ${pct(b.llm_confidence_mean)}; ` +
            `cobertura de evidências ${pct(b.evidence_coverage)} ` +
            `(${b.with_evidence_count} de ${b.classified_count} linhas classificadas com trechos recuperados). ` +
            "Isto mede aderência da recuperação e coerência estatística das respostas, não certeza jurídica."
          )
        })()
      : kind === "classification" && classification
        ? classification.justification
        : kind === "chip" && tag
          ? `O perfil estratégico «${tag.label}» corresponde a um padrão textual do contexto da empresa. ` +
            "Esta classificação resulta do reconhecimento imediato no cliente combinado com o vocabulário atualizado pelo servidor após o processamento da simulação. " +
            "Os chips materializam o vocabulário fiscal do TribIA; a citação integral de dispositivos da LC 68/2024 " +
            "liga-se à classificação das despesas com recuperação RAG."
          : "—"

  const legalBase =
    kind === "macro" && aiMeta
      ? aiMeta.sources_analyzed.length > 0
        ? `Artigos e trechos referenciados no agregado: ${aiMeta.sources_analyzed.join("; ")}.`
        : "Nenhum rótulo de artigo consolidado; o score reflete apenas similaridade numérica dos chunks."
      : kind === "classification" && classification
        ? classification.legal_base.trim()
        : kind === "chip"
          ? "A base legal detalhada por artigo será exibida quando existir classificação em lote com evidências recuperadas."
          : "—"

  const risk =
    kind === "macro"
      ? "Agregado — o risco por linha está na tabela de despesas."
      : kind === "classification" && classification
        ? classification.risk_level
        : kind === "chip"
          ? "Contexto (não aplicável à linha de despesa)"
          : "—"

  const evidence =
    kind === "classification" && classification && classification.evidence?.length
      ? classification.evidence
      : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full gap-0 overflow-y-auto">
        <SheetHeader className="border-b border-border/60 pb-4 text-left">
          <SheetTitle className="font-heading text-lg font-medium tracking-tight pr-8">
            Briefing de auditoria
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground leading-relaxed">
            Nota técnica sintética — trilha entre o dado do cliente, a interpretação do modelo e a LC 68/2024.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Instância</p>
            <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
          </div>

          <section>
            <BriefingSectionTitle>Racional</BriefingSectionTitle>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{rational}</p>
          </section>

          <section className="relative">
            <BriefingSectionTitle>Base legal</BriefingSectionTitle>
            <div
              className={cn(
                "relative rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm leading-relaxed",
                !fullRayx && "min-h-[100px]",
              )}
            >
              <div className={cn(!fullRayx && "blur-[5px] select-none pointer-events-none")}>
                {legalBase ? (
                  <p className="text-foreground/90">{legalBase}</p>
                ) : (
                  <p className="text-muted-foreground">Sem citação normativa consolidada neste modo.</p>
                )}
                {evidence.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground list-none pl-0">
                    {evidence.slice(0, 6).map((ev) => (
                      <li key={ev.article_id} className="border-l-2 border-border pl-2">
                        <span className="font-mono text-xs text-foreground/80">{ev.article_id}</span>
                        <span className="block line-clamp-2 mt-0.5">{ev.content}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {!fullRayx && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55 px-4 text-center">
                  <p className="text-xs text-foreground/90 max-w-[260px] leading-snug">
                    O trecho correspondente no contexto aparece desfocado no hub central; no Pro vê o realce nítido. Veja o artigo exacto na LC 68 e a lista de evidências RAG completas — disponível no plano Pro.
                  </p>
                  <Link
                    href="/#planos"
                    className={cn(buttonVariants({ variant: "default", size: "sm" }), "pointer-events-auto")}
                  >
                    Upgrade para Pro
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section>
            <BriefingSectionTitle>Análise de risco</BriefingSectionTitle>
            <p className="text-sm capitalize text-foreground/90">{risk}</p>
          </section>
        </div>

        <div className="mt-auto border-t border-border/50 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
          {kind === "macro"
            ? "Indicador macro derivado das classificações e da recuperação RAG. Para evidência por despesa, use a tabela e o briefing por linha."
            : kind === "classification"
              ? "Raio-X: o realce no «Contexto da empresa» segue matched_span devolvido pelo motor de classificação (índices em pontos de código Unicode alinhados ao texto enviado à API)."
              : kind === "chip"
                ? "Raio-X: o realce aproxima o padrão da etiqueta ao texto por heurística no cliente; se não houver trecho destacado, o padrão não foi localizado de forma única neste contexto — confie no racional acima."
                : "—"}
        </div>
      </SheetContent>
    </Sheet>
  )
}
