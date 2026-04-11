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
 *   - Três pílulas horizontais; inactivas em bg-muted (whisper-quiet).
 *   - Cores semânticas do produto: emerald (verde), amber (âmbar), red (risco).
 *   - Valor % em Sans operacional (tabular-nums, Geist).
 *   - Rótulo "Solidez da tese" em Sans; Serif APENAS com Board-Ready (font-board-report).
 *   - Nenhum glow ou sombra chamativa — o hero visual permanece o FinancialVerdictHeroCard.
 *
 * ACESSIBILIDADE:
 *   - Região `aria-live="polite"` para anunciar mudanças quando o score chegar
 *     de forma assíncrona (ex.: verdictThesisPending → score disponível).
 *   - Estado pending com aria-busy + texto descritivo para leitores de ecrã.
 *   - `role="img"` no conjunto de pílulas com aria-label completo (tier + %).
 *
 * MEMOIZAÇÃO:
 *   - `useMemo` dependente do score normalizado: tier, classes das pílulas e
 *     texto de aria-label computados uma única vez por score.
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

interface PillConfig {
  /** Tier que esta pílula representa. */
  tier: ConfidenceTier
  /** Classes Tailwind quando está INACTIVA. */
  inactiveClass: string
  /** Classes Tailwind quando está ACTIVA. */
  activeClass: string
}

const PILL_CONFIG: PillConfig[] = [
  {
    tier: "green",
    inactiveClass: "bg-muted/50",
    activeClass:
      "bg-emerald-500/20 border border-emerald-500/50 dark:bg-emerald-500/15 dark:border-emerald-400/40",
  },
  {
    tier: "yellow",
    inactiveClass: "bg-muted/50",
    activeClass:
      "bg-amber-500/20 border border-amber-500/50 dark:bg-amber-500/15 dark:border-amber-400/40",
  },
  {
    tier: "red",
    inactiveClass: "bg-muted/50",
    activeClass:
      "bg-red-500/15 border border-red-500/40 dark:bg-red-500/12 dark:border-red-400/35",
  },
]

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
    const pillClasses = PILL_CONFIG.map((p) => ({
      isActive: p.tier === tier,
      activeClass: p.activeClass,
      inactiveClass: p.inactiveClass,
    }))
    return { tier, pct, label, ariaLabel, pillClasses }
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
          className="flex items-center gap-1.5"
        >
          <Skeleton className="h-2 w-16 rounded-full" />
          <Skeleton className="h-2 w-10 rounded-full" />
          <Skeleton className="h-2 w-8 rounded-full" />
        </div>
      )}

      {/* Estado: score disponível */}
      {!pending && derived && (
        <div className="flex items-center gap-2">
          {/* Trio de pílulas */}
          <div
            role="img"
            aria-label={derived.ariaLabel}
            className="flex items-center gap-1"
          >
            {derived.pillClasses.map(({ isActive, activeClass, inactiveClass }, i) => (
              <span
                key={i}
                className={cn(
                  "block h-1.5 rounded-full transition-colors",
                  i === 0 ? "w-10" : i === 1 ? "w-7" : "w-5",
                  isActive ? activeClass : inactiveClass,
                )}
                aria-hidden
              />
            ))}
          </div>

          {/* Score numérico + rótulo de tier */}
          <div className="flex items-baseline gap-1.5">
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
