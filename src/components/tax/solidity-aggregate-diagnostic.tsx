"use client"

/**
 * SolidityAggregateDiagnostic — item 2.3.2
 *
 * A «voz do auditor»: frase de posicionamento institucional logo abaixo do
 * semáforo (2.3.1), antes da fundamentação narrativa (Parecer executivo).
 *
 * CONTRATO (tribia_core_rules §1):
 *   - Tier via `buildAggregateSolidityDiagnosticMessage` → `confidenceTierFromScore01`.
 *   - Zero lógica fiscal; só consome props de metadados RAG já produzidos.
 *   - Y% / Z%: cobertura de evidências, não cálculo Go.
 *
 * DESIGN (system.md — Institucional Moderno):
 *   - Família Shield unificada com o FinancialVerdictHeroCard:
 *       ShieldCheck → verde, ShieldAlert → âmbar / vermelho.
 *   - Operacional: font-sans, text-sm.
 *   - Board-Ready: font-board-report, text-base (Serif só no rótulo e corpo).
 *   - Ícone: size-4, shrink-0, aria-hidden; cores semânticas contidas.
 *
 * ANTI–LAYOUT SHIFT:
 *   - Contentor com `min-h-[2.75rem]` reserva a altura típica de 2 linhas
 *     (text-sm leading-snug ≈ 1.375rem × 2 = 2.75rem), para o <hr> e o
 *     parecer executivo não saltarem quando o skeleton hidrata.
 *   - Skeleton espelha anatomia real: duas barras com mesma leading/height.
 *
 * ACESSIBILIDADE:
 *   - role="status" no skeleton; aria-hidden no ícone.
 *   - O aria-live está no wrapper pai (verdict-thesis-panel.tsx); sem aninhamento.
 */

import { useMemo } from "react"
import { ShieldAlert, ShieldCheck } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useTribiaPlgTier } from "@/hooks/use-tribia-plg-tier"
import { buildAggregateSolidityDiagnosticMessage } from "@/lib/aggregate-solidity-diagnostic"
import { cn } from "@/lib/utils"
import type { ConfidenceTier } from "@/lib/confidence-tiers"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SolidityAggregateDiagnosticProps {
  /** Score normalizado 0–1 (parseado por parseConfidenceScore01). Null = sem dado. */
  score: number | null
  /** `breakdown.evidence_coverage` da API (0–1). Null quando ausente. */
  evidenceCoverage01?: number | null
  /** Pending: mostra skeleton com altura reservada. */
  pending?: boolean
  /** Board-Ready: activa font-board-report no corpo da mensagem. */
  presentationMode?: boolean
  className?: string
}

// ─── Mapeamento de ícones Shield ─────────────────────────────────────────────

function ShieldIcon({ tier, className }: { tier: ConfidenceTier; className?: string }) {
  if (tier === "green") {
    return <ShieldCheck className={cn("size-4 shrink-0", className)} aria-hidden />
  }
  return <ShieldAlert className={cn("size-4 shrink-0", className)} aria-hidden />
}

function tierIconClass(tier: ConfidenceTier): string {
  switch (tier) {
    case "green":
      return "text-emerald-600 dark:text-emerald-400"
    case "yellow":
      return "text-amber-600 dark:text-amber-400"
    case "red":
      return "text-red-700 dark:text-red-400"
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function SolidityAggregateDiagnostic({
  score,
  evidenceCoverage01,
  pending = false,
  presentationMode = false,
  className,
}: SolidityAggregateDiagnosticProps) {
  const plgTier = useTribiaPlgTier()
  const isPro = plgTier === "pro" || plgTier === "premium"

  const diagnostic = useMemo(() => {
    if (score == null || !Number.isFinite(score)) return null
    return buildAggregateSolidityDiagnosticMessage({
      score,
      evidenceCoverage01: evidenceCoverage01 ?? null,
      isPro,
    })
  }, [score, evidenceCoverage01, isPro])

  return (
    /*
     * min-h-[2.75rem] reserva 2 linhas de text-sm leading-snug.
     * Garante que o <hr> e o Parecer executivo não saltam durante a
     * transição pending → dados (anti-layout-shift).
     */
    <div
      className={cn(
        "min-h-[2.75rem]",
        className,
      )}
    >
      {/* Estado: a carregar */}
      {pending && (
        <div
          role="status"
          aria-label="A carregar diagnóstico de solidez"
          className="space-y-1.5 pt-0.5"
        >
          {/* Duas barras espelham a anatomia do parágrafo final */}
          <Skeleton className="h-[1.125rem] w-[90%] rounded" />
          <Skeleton className="h-[1.125rem] w-[70%] rounded" />
        </div>
      )}

      {/* Estado: diagnóstico disponível */}
      {!pending && diagnostic && (
        <div className="flex items-start gap-2">
          {/* Ícone Shield — família unificada com o hero financeiro */}
          <ShieldIcon
            tier={diagnostic.tier}
            className={cn("mt-0.5", tierIconClass(diagnostic.tier))}
          />

          {/* Mensagem institucional */}
          <p
            className={cn(
              "text-sm leading-snug text-foreground",
              presentationMode && "font-board-report text-base leading-relaxed",
            )}
          >
            {diagnostic.message}
          </p>
        </div>
      )}

      {/* Estado: sem dados — sem ruído (semáforo já mostra «indisponível») */}
      {!pending && !diagnostic && null}
    </div>
  )
}
