"use client"

/**
 * ExpenseSemanticConfidenceDot — item 3.2.1 (Gauge de Confiança Individual).
 *
 * Microscópio da Mesa de Operações: transforma o score de confiança semântica
 * de cada linha de despesa num indicador minimalista (dot) com tooltip PRO.
 *
 * CONTRATOS (tribia_core_rules §1, §3 — "IA explica; Go calcula"):
 *   - Tier derivado EXCLUSIVAMENTE de `confidenceTierFromScore01` (limiares 2.3.1).
 *   - Proibido hardcode de 0.85 / 0.60 neste ficheiro.
 *   - Score normalizado via `parseConfidenceScore01`; null → estado "sem dado".
 *   - Zero aritmética fiscal — exibição do confidence já produzido pela camada IA.
 *
 * LINGUAGEM SHIELD (paridade 2.3.2 — SolidityAggregateDiagnostic):
 *   - ShieldCheck (verde) / ShieldAlert (âmbar + vermelho), mesma iconografia.
 *   - Copy canónica: «X% de Confiança Jurídica».
 *
 * CROMÁTICA (system.md — Institucional Moderno):
 *   - Verde: bg-emerald-500 | Âmbar: bg-amber-500.
 *   - Vermelho: var(--tribia-verdict-increase-fg) — Slate-Red técnico de auditoria;
 *     evita red-500 saturado (tom de erro de sistema, não de análise fiscal).
 *
 * BOARD-READY (system.md):
 *   - board-ready:opacity-70 no trigger — prioridade ao dado financeiro para o CFO.
 *   - Sem tipografia Serif: elemento operacional (Geist Sans), não narrativa.
 *
 * PERFORMANCE:
 *   - Exportado com React.memo; props primitivas para comparação estável.
 *   - Manter apenas rendering condicional (tooltip + ícone) sem estado local.
 *
 * DOIS CANAIS (Passo 3):
 *   - O dot reflecte sempre o confidence da IA (nexo semântico).
 *   - hasConsultantOverride: ShieldCheck emerald ao lado — curadoria humana no cálculo.
 */

import { memo } from "react"
import { ShieldAlert, ShieldCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  aggregatedScoreToPercent,
  confidenceTierFromScore01,
  confidenceTierShortLabel,
  parseConfidenceScore01,
  type ConfidenceTier,
} from "@/lib/confidence-tiers"
import { cn } from "@/lib/utils"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ExpenseSemanticConfidenceDotProps {
  /** Score bruto da API (number ou string); normalizado internamente. */
  score: unknown
  /** Justificativa da IA para o enquadramento — exibida no tooltip ("IA explica"). */
  justification?: string | null
  /** Activa redução de brilho (Board-Ready): CFO foca nos valores financeiros. */
  presentationMode?: boolean
  /**
   * Texto de erro da classificação — nota adicional no tooltip.
   * Não altera o tier: a cor do dot segue sempre `confidenceTierFromScore01(score)`.
   */
  error?: string | null
  /**
   * Quando a linha tem substituição manual, mostra um ShieldCheck (curadoria)
   * além do dot — a cor do dot continua a seguir o confidence da IA.
   */
  hasConsultantOverride?: boolean
}

// ─── Helpers de estilo ────────────────────────────────────────────────────────

function dotBgClass(tier: ConfidenceTier): string {
  switch (tier) {
    case "green":
      return "bg-emerald-500"
    case "yellow":
      return "bg-amber-500"
    case "red":
      // Slate-Red institucional: var(--tribia-verdict-increase-fg) em globals.css.
      // oklch(0.33 0.10 22) light / oklch(0.60 0.10 22) dark — auditoria, não pânico.
      return "bg-[var(--tribia-verdict-increase-fg)]"
  }
}

function shieldIconColorClass(tier: ConfidenceTier): string {
  switch (tier) {
    case "green":
      return "text-emerald-400"
    case "yellow":
      return "text-amber-400"
    case "red":
      return "text-red-400"
  }
}

function ShieldIcon({ tier }: { tier: ConfidenceTier }) {
  const cls = cn("size-3.5 shrink-0", shieldIconColorClass(tier))
  if (tier === "green") return <ShieldCheck className={cls} aria-hidden />
  return <ShieldAlert className={cls} aria-hidden />
}

// ─── Componente ───────────────────────────────────────────────────────────────

function ExpenseSemanticConfidenceDotInner({
  score,
  justification,
  presentationMode = false,
  error,
  hasConsultantOverride = false,
}: ExpenseSemanticConfidenceDotProps) {
  const score01 = parseConfidenceScore01(score)

  if (score01 === null) {
    return (
      <span
        className="inline-flex items-center justify-center gap-1"
        aria-label={
          hasConsultantOverride
            ? "Sem score de confiança da IA — decisão do consultor aplicada ao cálculo"
            : "Sem confiança de classificação"
        }
      >
        {hasConsultantOverride ? (
          <ShieldCheck
            className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
        ) : null}
        <span className="text-xs text-muted-foreground" aria-hidden>
          —
        </span>
      </span>
    )
  }

  const tier = confidenceTierFromScore01(score01)
  const pct = aggregatedScoreToPercent(score01)
  const tierLabel = confidenceTierShortLabel(tier)
  // Ex.: "Sólido — 92 por cento de confiança jurídica"
  const baseAria = `${tierLabel} — ${pct} por cento de confiança jurídica (análise IA)`
  const ariaLabel = hasConsultantOverride
    ? `${baseAria} · Decisão do consultor aplica-se ao cálculo do motor`
    : baseAria

  const justTrimmed = justification?.trim() || null
  const errTrimmed = error?.trim() || null

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-sm p-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // Board-Ready: whisper-quiet — prioridade ao dado financeiro (system.md).
          presentationMode ? "opacity-70" : "board-ready:opacity-70",
        )}
      >
        <span
          className={cn(
            "block h-2.5 w-2.5 shrink-0 rounded-full",
            dotBgClass(tier),
          )}
        />
        {hasConsultantOverride ? (
          <ShieldCheck
            className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
        ) : null}
      </TooltipTrigger>

      <TooltipContent
        side="right"
        sideOffset={6}
        className="max-w-[min(20rem,calc(100vw-2rem))] text-left"
      >
        {/*
         * Layout em coluna dentro do tooltip (substitui o inline-flex padrão
         * com um wrapper div para estrutura de duas linhas).
         */}
        <div className="flex flex-col gap-1.5">
          {/* Linha principal: ícone Shield + percentagem (paridade 2.3.2) */}
          <span className="flex items-center gap-1.5 text-xs font-medium leading-none">
            <ShieldIcon tier={tier} />
            <span>{pct}% de Confiança Jurídica</span>
          </span>

          {/* Justificativa PRO — fundamentação da IA (tribia_core_rules §1: "IA explica") */}
          {justTrimmed ? (
            <p
              className="line-clamp-4 text-xs leading-snug opacity-70"
              title={justTrimmed}
            >
              {justTrimmed}
            </p>
          ) : null}

          {/* Nota de erro: copy adicional; tier numérico não é alterado */}
          {errTrimmed ? (
            <p className="text-xs italic leading-snug opacity-60">
              Erro de classificação — revise esta linha manualmente.
            </p>
          ) : null}

          {hasConsultantOverride ? (
            <p className="border-t border-border/50 pt-1.5 text-xs leading-snug text-emerald-700/90 dark:text-emerald-300/90">
              A decisão do consultor (substituição manual) é a que prevalece no envio
              ao motor de cálculo. O percentual acima reflete a confiança da
              análise automática, não o risco após a sua correção.
            </p>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export const ExpenseSemanticConfidenceDot = memo(ExpenseSemanticConfidenceDotInner)
ExpenseSemanticConfidenceDot.displayName = "ExpenseSemanticConfidenceDot"
