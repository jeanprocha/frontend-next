"use client"

/**
 * SolidityTrafficLight — Semáforo de Solidez Jurídica (item 2.3.1).
 *
 * CONTRATO (tribia_core_rules §1 — "IA explica; Go calcula"):
 *   - O tier é derivado EXCLUSIVAMENTE de `confidenceTierFromScore01`.
 *   - O componente não define limiares; usa CONFIDENCE_TIER_GREEN_MIN /
 *     CONFIDENCE_TIER_YELLOW_MIN de forma indirecta, pois a função canónica
 *     já as encapsula. Se o motor alterar os critérios, a UI segue sozinha.
 *   - Proibido 0.85 / 0.60 hardcoded neste ficheiro.
 *
 * DESIGN (system.md — Institucional Moderno):
 *   - Uma faixa de progresso contínua (0–100%) alinhada ao score agregado;
 *     a cor do preenchimento segue o tier (emerald / amber / red), não
 *     semáforo de 3 pílulas (evita confusão «só 1/3 preenchido» vs «93%»).
 *   - Valor % em Sans operacional (tabular-nums, Geist) + rótulo de tier.
 *   - Rótulo "Solidez da tese" em Sans; Serif APENAS com Board-Ready (font-board-report).
 *
 * ACESSIBILIDADE:
 *   - `role="img"` na track com aria-label (tier + %). Região viva fica no pai.
 *
 * MEMOIZAÇÃO:
 *   - `useMemo` dependente do score: tier, pct, ariaLabel.
 */

import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  aggregatedScoreToPercent,
  confidenceTierFromScore01,
  confidenceTierShortLabel,
  type ConfidenceTier,
} from "@/lib/confidence-tiers"
import { cn } from "@/lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SolidityTrafficLightProps {
  /**
   * Score bruto 0–1 já parseado e clampado por `parseConfidenceScore01`.
   * `null` quando aiMetadata não está disponível.
   */
  score: number | null
  /**
   * `true` enquanto o painel aguarda resposta (POST em curso / stream futuro).
   * Mostra skeleton acessível em lugar dos segmentos.
   */
  pending?: boolean
  /** Activa tipografia Board-Ready (font-board-report / Serif) no rótulo. */
  presentationMode?: boolean
  className?: string
}

// ─── Helpers de estilo ────────────────────────────────────────────────────────

function tierFillClass(tier: ConfidenceTier): string {
  switch (tier) {
    case "green":
      return "bg-emerald-500/90 dark:bg-emerald-400/85"
    case "yellow":
      return "bg-amber-500/90 dark:bg-amber-400/85"
    case "red":
      return "bg-red-500/85 dark:bg-red-400/80"
  }
}

function tierTextClass(tier: ConfidenceTier): string {
  switch (tier) {
    case "green":
      return "text-emerald-700 dark:text-emerald-300"
    case "yellow":
      return "text-amber-700 dark:text-amber-300"
    case "red":
      return "text-red-700 dark:text-red-300"
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function SolidityTrafficLight({
  score,
  pending = false,
  presentationMode = false,
  className,
}: SolidityTrafficLightProps) {
  const derived = useMemo(() => {
    if (score == null || !Number.isFinite(score)) return null
    const tier = confidenceTierFromScore01(score)
    const pct = aggregatedScoreToPercent(score)
    const label = confidenceTierShortLabel(tier)
    const ariaLabel = `Solidez da tese: ${label}, ${pct} por cento`
    return { tier, pct, label, ariaLabel, fillClass: tierFillClass(tier) }
  }, [score])

  return (
    /*
     * aria-live foi movido para o wrapper pai em verdict-thesis-panel.tsx,
     * que envolve semáforo + diagnóstico num único região ao vivo — evita
     * regiões aninhadas e anúncios duplicados.
     */
    <div className={cn("space-y-1.5", className)}>
      {/* Rótulo */}
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
          presentationMode &&
            "font-board-report normal-case text-sm tracking-normal font-semibold text-foreground",
        )}
      >
        Solidez da tese
      </p>

      {/* Estado: a carregar */}
      {pending && (
        <div
          role="status"
          aria-label="A carregar indicador de solidez"
          aria-busy="true"
          className="flex min-w-0 items-center gap-3"
        >
          <Skeleton className="h-2 w-full max-w-[14rem] flex-1 rounded-full" />
          <Skeleton className="h-4 w-12 shrink-0 rounded" />
        </div>
      )}

      {/* Estado: score disponível */}
      {!pending && derived && (
        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <div
            role="img"
            aria-label={derived.ariaLabel}
            className="h-2 min-w-0 flex-1 max-w-[14rem] rounded-full bg-muted/80 dark:bg-muted/50"
          >
            <div
              className={cn(
                "h-full min-w-0 rounded-full transition-[width] duration-300 ease-out",
                derived.fillClass,
              )}
              style={{ width: `${Math.min(100, Math.max(0, derived.pct))}%` }}
            />
          </div>
          <div className="flex shrink-0 items-baseline gap-1.5">
            <span
              className={cn(
                "font-sans text-sm font-semibold tabular-nums",
                tierTextClass(derived.tier),
              )}
            >
              {derived.pct}%
            </span>
            <span
              className={cn(
                "text-[11px] font-medium text-muted-foreground",
                presentationMode && "font-board-report",
              )}
            >
              {derived.label}
            </span>
          </div>
        </div>
      )}

      {/* Estado: sem dados de auditoria */}
      {!pending && !derived && (
        <p className="text-[11px] text-muted-foreground">
          Solidez jurídica indisponível — execute com classificação por IA.
        </p>
      )}
    </div>
  )
}
