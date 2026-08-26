"use client"

/**
 * Card do Veredito Financeiro — item 2.1.1 + 2.1.2.
 *
 * CONTRATO DE DADOS (mantra "IA explica; Go calcula" — tribia_core_rules §1):
 *   - Lê apenas `simulation.delta` e `simulation.delta_pct` vindos do motor Go.
 *   - É terminantemente proibido recalcular o delta no frontend
 *     (ex.: projected.net_tax − current.net_tax).
 *   - Se `delta` estiver ausente ou inválido → estado "indisponível" explícito,
 *     sinalizando que a fonte da verdade (motor Go) não enviou o campo.
 *   - Toda formatação monetária usa formatBRL / formatBRLCompact (pipeline BigInt);
 *     proibido Number() / parseFloat() na magnitude do delta.
 *
 * SINALIZAÇÃO SEMÂNTICA (item 2.1.2 — Institucional Moderno — system.md):
 *   - Polaridade derivada exclusivamente via `deriveFinancialVerdictPolarity`
 *     (Decimal sobre string da API — sem float, sem heurística de prefixo "-").
 *   - Mapa visual (classes + copy + ícone) computado por `useMemo` com deps
 *     estáveis: delta trim, plgTier, presentationMode.
 *   - Pro/Premium: paleta Slate-Red técnica para aumento (auditoria, não pânico);
 *     Free: tom mais directo mas mesma família lexical.
 *   - Ícones família Shield: ShieldCheck (economia validada) / ShieldAlert
 *     (carga adicional detectada) — metáfora coerente com o selo RAG na coluna direita.
 *   - Rótulos textuais sempre visíveis: contraste não depende só de cor (WCAG).
 *
 * LAYOUT (item 2.2.1 — só Trib/Go):
 *   - Este cartão exibe APENAS o impacto numérico Go (delta + variação %).
 *   - A coluna "Solidez Legislativa" RAG foi removida: a narrativa semântica
 *     passa para o `VerdictThesisPanel` (Lado B), componente irmão no orquestrador.
 *   - Regra: um protagonista por ideia (system.md "whisper-quiet").
 *
 * TIPOGRAFIA (system.md):
 *   - Geist Sans para valores operacionais (canvas diário).
 *   - Serif (board-ready:font-board-report) apenas no modo Board-Ready para
 *     rótulos executivos — nunca no canvas operacional; valores numéricos
 *     permanecem sempre Geist + tabular-nums.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { ShieldAlert, ShieldCheck, ShieldMinus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { deriveFinancialVerdictPolarity } from "../lib/financial-verdict-polarity"
import { parseApiDecimal } from "@/lib/money-decimal"
import {
  decimalStringToCents,
  formatBRL,
  formatBRLCompact,
  formatPct,
} from "@/lib/format-money"
import { FISCAL_LAW_CHANGELOG } from "@/lib/fiscal-law-changelog"
import { useCapability } from "@/features/plg"
import type { SimulationResponse } from "@/types/api"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface FinancialVerdictHeroCardProps {
  simulation: SimulationResponse
  /**
   * @deprecated A solidez RAG foi movida para o `VerdictThesisPanel` (item 2.2.1).
   * Mantido na assinatura para compatibilidade; ignorado internamente.
   */
  aiMetadata?: unknown
  /**
   * Activado via use-board-ready; quando true a tipografia de rótulos executivos
   * troca para Serif (font-board-report). Valores numéricos mantêm Geist bold.
   */
  presentationMode?: boolean
  /**
   * 3.4.2 — Verdadeiro enquanto o motor Go está a recalcular após override.
   * Aplica opacity-50 + shimmer subtil nos valores monetários (whisper-quiet).
   * NÃO afecta o título "Veredito Financeiro" nem o selo — hierarquia Top-Down
   * permanece legível durante a sincronização (system.md ambient transitions).
   */
  isRecalculating?: boolean
  /**
   * Classificações alteradas mas o POST ainda não devolveu (debounce ou fila) —
   * rebaixa os valores como desatualizados; pulse só com isRecalculating.
   */
  pendingSimulationSync?: boolean
  className?: string
}

// ─── Mapa visual por estado ───────────────────────────────────────────────────

/**
 * Retorna o conjunto de classes, copy e ícone para cada estado do veredito,
 * diferenciado por tier PLG e modo de apresentação.
 *
 * DESIGN (Institucional Moderno):
 *   - Pro/Premium: Slate-Red técnico para aumento (ponto de atenção em auditoria,
 *     não erro crítico de sistema). Emerald contido para economia.
 *   - Free: mesmo léxico, saturação ligeiramente maior para leitura "calculadora".
 *   - Ícones Shield: metáfora de dossiê de auditoria.
 */
function buildVerdictVisuals(
  polarity: ReturnType<typeof deriveFinancialVerdictPolarity>,
  isPro: boolean,
) {
  switch (polarity) {
    case "economy":
      return {
        SealIcon: ShieldCheck,
        sealLabel: "Economia identificada",
        badgeVariant: "verdictEconomy" as const,
        borderClass:
          "border-emerald-500/30 dark:border-emerald-500/35",
        bgClass:
          "bg-emerald-500/[0.03] dark:bg-emerald-950/10",
        deltaTextClass:
          "text-emerald-600 dark:text-emerald-400 print:text-foreground",
        glowClass: "bg-emerald-500/[0.07]",
        iconClass: "text-emerald-600 dark:text-emerald-500",
      }

    case "increase":
      return {
        SealIcon: ShieldAlert,
        // Pro: vocabulário de projeção fiscal. Free: tom mais operacional.
        sealLabel: isPro ? "Carga adicional projetada" : "Aumento de carga",
        badgeVariant: "verdictIncrease" as const,
        borderClass: isPro
          ? "border-red-700/20 dark:border-red-700/30"
          : "border-red-600/25 dark:border-red-600/35",
        bgClass: isPro
          ? "bg-red-500/[0.025] dark:bg-red-950/10"
          : "bg-red-500/[0.04] dark:bg-red-950/15",
        deltaTextClass: isPro
          ? "text-red-900 dark:text-red-400 print:text-foreground"
          : "text-red-700 dark:text-red-300 print:text-foreground",
        glowClass: "bg-red-500/[0.04]",
        iconClass: isPro
          ? "text-red-900 dark:text-red-400"
          : "text-red-700 dark:text-red-300",
      }

    case "neutral":
      return {
        SealIcon: ShieldMinus,
        sealLabel: "Sem variação material",
        badgeVariant: "verdictNeutral" as const,
        borderClass: "border-border/80",
        bgClass: "bg-card",
        deltaTextClass: "text-slate-700 dark:text-slate-200",
        glowClass: "",
        iconClass: "text-slate-500 dark:text-slate-400",
      }

    default:
      return null
  }
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function FinancialVerdictHeroCard({
  simulation,
  presentationMode = false,
  isRecalculating = false,
  pendingSimulationSync = false,
  className,
}: FinancialVerdictHeroCardProps) {
  const isPro = useCapability("rayxFull")

  // ── Polaridade — fonte exclusiva: simulation.delta (motor Go) ─────────────
  // `deriveFinancialVerdictPolarity` usa Decimal internamente — sem float.
  const rawDelta = simulation.delta?.trim()
  const rawDeltaPct = simulation.delta_pct?.trim()
  const polarity = deriveFinancialVerdictPolarity(rawDelta)

  const deltaValid = polarity !== "invalid"
  const isSaving = polarity === "economy"
  const isNeutral = polarity === "neutral"

  // Valor absoluto para formatação — só derivado se o delta for válido.
  // Pipeline: parseApiDecimal → Decimal.abs().toFixed(2) → formatBRL (BigInt).
  const deltaD = deltaValid ? parseApiDecimal(rawDelta!) : null
  const absStr = deltaD ? deltaD.abs().toFixed(2) : "0"
  const absCents = deltaValid ? decimalStringToCents(absStr) : null
  const showCompact =
    absCents !== null && absCents >= 100_000_000n && !isNeutral

  const lawVersion = FISCAL_LAW_CHANGELOG.version

  // ── Mapa visual memoizado ─────────────────────────────────────────────────
  // Deps estáveis: delta trim, tier PRO.
  // Recalcula apenas quando muda o sinal do delta ou o plano.
  const visuals = useMemo(
    () => buildVerdictVisuals(polarity, isPro),
    [polarity, isPro],
  )

  // Estado inválido: classes neutras de fallback.
  const borderClass = visuals?.borderClass ?? "border-border/80"
  const bgClass = visuals?.bgClass ?? "bg-card"
  const deltaTextClass =
    visuals?.deltaTextClass ?? "text-slate-700 dark:text-slate-200"

  // ── 3.4.2 Flash Emerald — confirmação semântica do motor Go ───────────────
  //
  // Quando isRecalculating transita de true → false E os valores mudaram,
  // aplica bg-emerald-500/10 durante ~400ms nos valores monetários.
  // Duração total < 500ms (requisito da auditoria PRO).
  //
  // prefers-reduced-motion: o flash usa apenas transição de cor (opacity/bg),
  // não animação contínua — seguro para redução de movimento.
  const [flashValues, setFlashValues] = useState(false)
  const wasRecalculatingRef = useRef(false)
  const prevDeltaRef = useRef<string | undefined>(rawDelta)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const justFinished = wasRecalculatingRef.current && !isRecalculating
    wasRecalculatingRef.current = isRecalculating

    if (justFinished && prevDeltaRef.current !== rawDelta) {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      setFlashValues(true)
      flashTimerRef.current = setTimeout(() => setFlashValues(false), 400)
    }

    // Actualiza snapshot apenas fora do período de recálculo.
    if (!isRecalculating) {
      prevDeltaRef.current = rawDelta
    }

    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [isRecalculating, rawDelta])

  return (
    <article
      id="tribia-financial-verdict-hero"
      aria-labelledby="tribia-fvh-title"
      className={cn(
        // Elevação: único pico de dramatismo nesta secção (whisper-quiet — system.md).
        "relative overflow-hidden rounded-xl border tribia-shadow-elevated",
        borderClass,
        bgClass,
        "board-ready:border board-ready:border-foreground/20 board-ready:shadow-none board-ready:bg-transparent",
        "print:border print:border-foreground/25 print:shadow-none print:bg-transparent",
        className,
      )}
    >
      {/* Ambient glow whisper-quiet — só aparece em economia/custo; nunca neon */}
      {deltaValid && !isNeutral && visuals?.glowClass && (
        <div
          className={cn(
            "pointer-events-none absolute -left-10 -top-10 size-40 rounded-full blur-3xl",
            "board-ready:hidden print:hidden",
            visuals.glowClass,
          )}
          aria-hidden
        />
      )}

      {/* Conteúdo único — só impacto Go (item 2.2.1: solidez moved to VerdictThesisPanel) */}
      <div className="relative z-10 space-y-3 p-5 md:p-6">
        {/*
         * HIERARQUIA TOP-DOWN (tribia_core_rules §3):
         * 1. Rótulo — contextualiza a secção
         * 2. Selo  — estado do veredito (Shield + rótulo textual)
         * 3. Valor — magnitude do delta
         * 4. %    — variação percentual
         * 5. Prov — rastro do motor Go / lei
         */}

        {/* 1. Rótulo — Sans no canvas; Serif apenas em Board-Ready */}
        <p
          id="tribia-fvh-title"
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
            presentationMode &&
              "font-board-report normal-case text-sm tracking-normal font-semibold text-foreground",
            "tribia-print-narrative-serif",
          )}
        >
          Veredito Financeiro
        </p>

        {deltaValid && visuals ? (
          <>
            {/* 2. Selo — Shield + rótulo institucional + a11y (nunca só cor) */}
            <div id="tribia-fvh-seal">
              <Badge
                variant={visuals.badgeVariant}
                className={cn(
                  "gap-1 px-2 py-0.5 text-xs font-semibold font-sans h-auto",
                  "board-ready:font-board-report board-ready:text-[11px] board-ready:border board-ready:border-current/30",
                )}
              >
                <visuals.SealIcon
                  className={cn("size-3 shrink-0", visuals.iconClass)}
                  aria-hidden
                />
                {visuals.sealLabel}
              </Badge>
            </div>

            {/*
             * 3+4. Valores monetários — bloco único com ambient UI (3.4.2).
             *
             * Ambient state (system.md — whisper-quiet):
             *   - isRecalculating: opacity-50 + shimmer subtil APENAS neste bloco.
             *     O título e o selo ficam a 100% — hierarquia Top-Down legível.
             *   - motion-safe:animate-pulse: shimmer só em ambientes sem
             *     prefers-reduced-motion (system.md ambient transitions §).
             *
             * Flash Emerald (confirmação semântica — <500ms total):
             *   - bg-emerald-500/10 com transition-colors 300ms.
             *   - Comunicação: «o motor Go processou a sua decisão».
             *   - Nunca permanece; Timer de 400ms garante duração < 500ms.
             */}
            <div
              aria-busy={isRecalculating || pendingSimulationSync}
              aria-live="polite"
              aria-label={
                isRecalculating
                  ? "A sincronizar com o motor Go…"
                  : pendingSimulationSync
                    ? "Valores ainda a reflectir a última decisão de classificação"
                    : undefined
              }
              className={cn(
                "space-y-2 rounded-lg transition-colors duration-300",
                // Ambient dim — números possivelmente defasados (pendente ou a calcular).
                (isRecalculating || pendingSimulationSync) && "opacity-50",
                isRecalculating && "motion-safe:animate-pulse",
                // Flash Emerald — confirmação semântica após sync bem-sucedido.
                // board-ready: suprimido para não poluir o relatório oficial.
                flashValues && "bg-emerald-500/10 board-ready:bg-transparent print:bg-transparent",
              )}
            >
              {/* 3. Valor hero — Geist bold, tabular-nums; nunca Serif */}
              <div
                className="flex flex-wrap items-baseline gap-2"
                aria-describedby="tribia-fvh-seal"
              >
                <span
                  className={cn(
                    "font-sans text-4xl font-bold tabular-nums tracking-tight sm:text-5xl",
                    deltaTextClass,
                  )}
                >
                  {isNeutral
                    ? formatBRL("0")
                    : `${isSaving ? "−" : "+"}${formatBRL(absStr)}`}
                </span>
                {showCompact && (
                  <span className="tabular-nums text-sm font-medium text-muted-foreground">
                    {isSaving ? "−" : "+"}{formatBRLCompact(absStr)}
                  </span>
                )}
              </div>

              {/* 4. Variação % — da API Go, sem recálculo */}
              {rawDeltaPct ? (
                <p
                  className={cn(
                    "text-sm tabular-nums text-muted-foreground",
                    presentationMode && "font-board-report",
                    "tribia-print-narrative-serif",
                  )}
                >
                  <span className={cn("font-semibold", deltaTextClass)}>
                    {formatPct(rawDeltaPct)}
                  </span>{" "}
                  sobre a carga líquida atual estimada
                </p>
              ) : null}
            </div>

            {/* 5. Proveniência — rastro do dado para a lei */}
            <p className="text-[10px] font-medium text-muted-foreground/80">
              Motor Go · LC 68/2024 v{lawVersion}
            </p>
          </>
        ) : (
          // ── Estado indisponível — a API não enviou delta (registo antigo) ──
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-sm font-medium text-muted-foreground">
              Delta indisponível
            </p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground/80">
              Este registo não contém o campo{" "}
              <code className="font-mono text-[10px]">delta</code> calculado
              pelo motor Go. Execute uma nova simulação para ver o veredito
              financeiro.
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
