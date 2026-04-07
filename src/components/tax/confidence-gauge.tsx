"use client"

import { motion, useReducedMotion } from "motion/react"
import { Info } from "lucide-react"
import { GlossaryHelpTrigger } from "@/components/tax/glossary-help-trigger"
import { cn } from "@/lib/utils"

/** Comprimento do arco semicircular r=40 (πr). */
const ARC_LEN = Math.PI * 40

const RAG_HELP_CONTENT = (
  <p className="text-xs leading-snug">
    Combina similaridade RAG, confiança do classificador e cobertura de linhas com evidência na LC
    68/2024. Mede aderência da <strong>recuperação e coerência agregada</strong>, não certeza jurídica.
    Use &quot;Como calculámos isto&quot; para o detalhe.
  </p>
)

function tierStrokeClass(percentage: number): string {
  if (percentage > 90) return ""
  if (percentage > 70) {
    return "stroke-amber-500 dark:stroke-amber-400"
  }
  return "stroke-red-500 dark:stroke-red-400"
}

function tierTextClass(percentage: number): string {
  if (percentage > 90) {
    return "text-emerald-600 dark:text-emerald-300"
  }
  if (percentage > 70) {
    return "text-amber-600 dark:text-amber-300"
  }
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

  const targetOffset = pct != null ? ARC_LEN - (ARC_LEN * pct) / 100 : ARC_LEN
  const useGradient = pct != null && pct > 90

  const figure = (
    <div className="relative flex h-[72px] w-[100px] items-end justify-center">
      <svg
        width="100"
        height="56"
        viewBox="0 0 100 56"
        className="overflow-visible"
        aria-hidden={indeterminate || pct == null}
        role={pct != null && !indeterminate ? "img" : undefined}
        aria-label={
          pct != null && !indeterminate ? `Relevância RAG ${pct} por cento` : undefined
        }
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
        ) : pct != null ? (
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
            className={useGradient ? undefined : tierStrokeClass(pct)}
          />
        ) : null}
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center pb-0.5">
        {indeterminate ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            …
          </span>
        ) : pct != null ? (
          <span
            className={cn(
              "text-lg font-black tracking-tighter tabular-nums",
              tierTextClass(pct),
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
        Relevância RAG
      </span>
      <GlossaryHelpTrigger
        preferSheetOnTouch
        ariaLabel="O que significa este indicador"
        sheetTitle="Sobre a relevância RAG"
        content={RAG_HELP_CONTENT}
        contentClassName="max-w-[min(100vw-2rem,280px)]"
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
      </div>
    )
  }

  return <div className={shellClass}>{figure}{footer}</div>
}
