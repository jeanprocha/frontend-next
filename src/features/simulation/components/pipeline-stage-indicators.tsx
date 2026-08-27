"use client"

import { cn } from "@/lib/utils"
import {
  PIPELINE_STAGE_LABEL_PT,
  type PipelineStage,
} from "../hooks/use-pipeline-stage"

/** Bússola visual (touch / viewport sem rail); leitura por voz via PipelineStageAnnouncer. */
export function PipelineStageCompass({
  stage,
  className,
}: {
  stage: PipelineStage
  className?: string
}) {
  return (
    <p
      className={cn(
        "text-xs text-muted-foreground lg:hidden print:hidden",
        className,
      )}
      aria-hidden="true"
    >
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
