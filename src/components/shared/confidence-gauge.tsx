"use client"

import { motion, useReducedMotion } from "motion/react"
import { Info } from "lucide-react"
import { GlossaryHelpTrigger } from "@/components/shared/glossary-help-trigger"
import { cn } from "@/lib/utils"
import {
  confidenceTierFromScore01,
  humanReviewHintFromAggregatedScore01,
  type ConfidenceTier,
} from "@/lib/confidence-tiers"

/** Comprimento do arco semicircular r=40 (πr). */
const ARC_LEN = Math.PI * 40

const RAG_HELP_CONTENT = (
  <div className="space-y-2 text-xs leading-snug">
    <p>
      <strong>IA explica</strong> o nexo legislativo (recuperação RAG); <strong>Go calcula</strong> impostos e deltas no
      motor — este arco mede só a camada de recuperação e coerência agregada.
    </p>
    <p>
      O valor combina similaridade RAG, confiança do classificador e cobertura de linhas com trechos na lei recuperada. Não é
      certeza jurídica nem probabilidade de acerto fiscal: trate como <strong>aderência à lei recuperada</strong>, com
      espaço para <strong>interpretação por analogia</strong> ou <strong>baixa evidência direta</strong> quando o
      semáforo não estiver verde.
    </p>
    <p>
      Use &quot;Como calculamos isto&quot; no cartão de auditoria RAG para a fórmula. Em âmbar ou vermelho, o TribIA
      assume <strong>rigor da incerteza</strong> — não esconde dúvida.
    </p>
  </div>
)

function tierStrokeClassFromTier(tier: ConfidenceTier): string {
  if (tier === "green") return ""
  if (tier === "yellow") return "stroke-amber-500 dark:stroke-amber-400"
  return "stroke-red-500 dark:stroke-red-400"
}

function tierTextClassFromTier(tier: ConfidenceTier): string {
  if (tier === "green") return "text-emerald-600 dark:text-emerald-300"
  if (tier === "yellow") return "text-amber-600 dark:text-amber-300"
  return "text-red-600 dark:text-red-300"
}

export interface ConfidenceGaugeProps {
  /** 0–1 relevância RAG agregada */
  score?: number | null
  /** Durante classificação — arco animado sem percentagem */
  indeterminate?: boolean
  /** Atalho para briefing agregado (plano 07) — torna o bloco focável e clicável. */
  onActivate?: () => void
  className?: string
}

export function ConfidenceGauge({
  score,
  indeterminate = false,
  onActivate,
  className,
}: ConfidenceGaugeProps) {
  const reduceMotion = useReducedMotion() ?? false
  const pct =
    indeterminate || score == null || !Number.isFinite(score)
      ? null
      : Math.round(Math.min(1, Math.max(0, score)) * 100)

  const tier: ConfidenceTier | null =
    score != null && Number.isFinite(score)
      ? confidenceTierFromScore01(score)
      : null

  const targetOffset = pct != null ? ARC_LEN - (ARC_LEN * pct) / 100 : ARC_LEN
  const useGradient = tier === "green"
  const humanReviewHint =
    score != null && Number.isFinite(score) && !indeterminate ? (
      (() => {
        const text = humanReviewHintFromAggregatedScore01(score)
        if (!text) return null
        return (
          <p className="mt-2 max-w-[240px] text-center text-[11px] leading-snug text-muted-foreground">{text}</p>
        )
      })()
    ) : null

  const figure = (
    <div className="relative flex h-[72px] w-[100px] items-end justify-center">
      <svg
        width="100"
        height="56"
        viewBox="0 0 100 56"
        className="overflow-visible"
        aria-hidden={indeterminate || pct == null}
        role={pct != null && !indeterminate ? "img" : undefined}
        aria-label={pct != null && !indeterminate ? `Índice de auditoria ${pct} por cento` : undefined}
      >
        <defs>
          <linearGradient id="ragGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              className="[stop-color:theme(colors.emerald.700)] dark:[stop-color:theme(colors.emerald.400)]"
            />
            <stop
              offset="100%"
              className="[stop-color:theme(colors.emerald.400)] dark:[stop-color:theme(colors.emerald.300)]"
            />
          </linearGradient>
        </defs>
        <path
          d="M 10 48 A 40 40 0 0 1 90 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-border"
          strokeLinecap="round"
        />
        {indeterminate ? (
          <motion.path
            d="M 10 48 A 40 40 0 0 1 90 48"
            fill="none"
            stroke="url(#ragGaugeGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LEN * 0.35} ${ARC_LEN}`}
            animate={reduceMotion ? undefined : { strokeDashoffset: [0, -ARC_LEN] }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 2.2, repeat: Infinity, ease: "linear" }
            }
          />
        ) : pct != null && tier != null ? (
          <motion.path
            d="M 10 48 A 40 40 0 0 1 90 48"
            fill="none"
            stroke={useGradient ? "url(#ragGaugeGrad)" : "currentColor"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            initial={{ strokeDashoffset: ARC_LEN }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.2, ease: [0.33, 1, 0.68, 1] }
            }
            className={useGradient ? undefined : tierStrokeClassFromTier(tier)}
          />
        ) : null}
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center pb-0.5">
        {indeterminate ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            …
          </span>
        ) : pct != null && tier != null ? (
          <span
            className={cn(
              "text-lg font-black tracking-tighter tabular-nums",
              tierTextClassFromTier(tier),
            )}
          >
            {pct}%
          </span>
        ) : (
          <span className="max-w-[92px] text-center text-xs leading-tight text-muted-foreground">
            Sem trechos recuperados
          </span>
        )}
      </div>
    </div>
  )

  const footer = (
    <div className="mt-1 flex items-center justify-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Índice de auditoria
      </span>
      <GlossaryHelpTrigger
        preferSheetOnTouch
        ariaLabel="O que significa este indicador"
        sheetTitle="Sobre a relevância RAG"
        content={RAG_HELP_CONTENT}
        contentClassName="max-w-[min(100vw-2rem,320px)]"
        className="text-muted-foreground hover:text-foreground"
      >
        <Info className="size-3.5 shrink-0" aria-hidden />
      </GlossaryHelpTrigger>
    </div>
  )

  const shellClass = cn(
    "flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/20 p-4 dark:bg-muted/10",
    className,
  )

  if (onActivate && !indeterminate && pct != null) {
    return (
      <div className={shellClass}>
        <button
          type="button"
          onClick={onActivate}
          className={cn(
            "flex flex-col items-center rounded-xl outline-none transition-colors",
            "hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "dark:hover:bg-muted/20",
          )}
          aria-label="Abrir briefing do indicador RAG agregado"
        >
          {figure}
        </button>
        {footer}
        {humanReviewHint}
      </div>
    )
  }

  return (
    <div className={shellClass}>
      {figure}
      {footer}
      {humanReviewHint}
    </div>
  )
}
