"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import {
  PIPELINE_STAGE_LABEL_PT,
  type PipelineStage,
} from "../hooks/use-pipeline-stage"

/**
 * Bússola visual textual, junto ao título. Etapa N/PR 6 (fato 8): antes vinha
 * `lg:hidden` — em telas grandes (o tamanho em que a demo normalmente
 * acontece) ela simplesmente não existia, e não havia substituto no layout
 * de desktop. Removido; continua `aria-hidden` porque PipelineStageAnnouncer
 * já cobre o leitor de tela via aria-live — mostrar os dois seria anúncio
 * duplicado.
 */
export function PipelineStageCompass({
  stage,
  className,
}: {
  stage: PipelineStage
  className?: string
}) {
  return (
    <p className={cn("text-xs text-muted-foreground print:hidden", className)} aria-hidden="true">
      Etapa atual:{" "}
      <span className="text-foreground/80">{PIPELINE_STAGE_LABEL_PT[stage]}</span>
    </p>
  )
}

export function PipelineStageAnnouncer({ stage }: { stage: PipelineStage }) {
  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      Etapa do simulador: {PIPELINE_STAGE_LABEL_PT[stage]}
    </p>
  )
}

const STAGE_ORDER: readonly PipelineStage[] = ["context", "classification", "simulation", "verdict"]

// "IA explica; Go calcula" (mantra do projeto, CLAUDE.md) — a legenda de
// cada etapa nomeia isso em vez de só repetir o rótulo curto acima do nó.
const STAGE_CAPTION_PT: Record<PipelineStage, string> = {
  context: "Dados prontos para simular.",
  classification: "A IA classifica cada despesa citando a legislação.",
  simulation: "O motor fiscal calcula o impacto ano a ano (determinístico).",
  verdict: "Veredito pronto.",
}

/**
 * Etapa N/PR 6 — substitui os skeletons genéricos da fase "loading"
 * (simulation-dashboard.tsx) por uma corrente das etapas reais do pipeline,
 * com a etapa em execução destacada. Decorativo: PipelineStageAnnouncer já
 * cobre o leitor de tela, então a corrida toda fica `aria-hidden`.
 */
export function PipelineStageProgress({
  stage,
  shouldReduceMotion,
  className,
}: {
  stage: PipelineStage
  shouldReduceMotion: boolean
  className?: string
}) {
  const currentIndex = STAGE_ORDER.indexOf(stage)

  return (
    <div className={cn("rounded-xl border bg-white p-6", className)} aria-hidden="true">
      <ol className="flex items-start">
        {STAGE_ORDER.map((s, i) => {
          const status = i < currentIndex ? "done" : i === currentIndex ? "active" : "pending"
          return (
            <li key={s} className={cn("flex items-start", i < STAGE_ORDER.length - 1 && "flex-1")}>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    "relative flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300",
                    status === "done" && "border-accent/40 bg-accent/10 text-accent",
                    status === "active" && "border-accent bg-accent text-white",
                    status === "pending" && "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {status === "active" && !shouldReduceMotion && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-accent"
                      initial={{ opacity: 0.5, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.8 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <span className="relative">{status === "done" ? "✓" : i + 1}</span>
                </span>
                <span
                  className={cn(
                    "text-xs font-medium leading-tight",
                    status === "active" ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {PIPELINE_STAGE_LABEL_PT[s]}
                </span>
              </div>
              {i < STAGE_ORDER.length - 1 && (
                <div
                  className={cn(
                    "mt-4 h-px flex-1 translate-y-[-0.5px]",
                    i < currentIndex ? "bg-accent/40" : "bg-border",
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-4 text-center text-sm text-muted-foreground">{STAGE_CAPTION_PT[stage]}</p>
    </div>
  )
}
