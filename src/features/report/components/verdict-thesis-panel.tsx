"use client"

/**
 * VerdictThesisPanel — item 2.2.1 + 2.3.1 (Lado B do Veredito Executivo).
 *
 * CONTRATO (tribia_core_rules §1 — "IA explica; Go calcula"):
 *   - Consome APENAS `markdown` já gerado pelo backend (`strategy_insight`).
 *   - PROIBIDO derivar, recalcular ou reinterpretar números aqui.
 *   - Zero lógica fiscal neste componente; é mensageiro de texto puro.
 *   - `scoreRaw` é metadado de auditoria vindo do backend — o componente
 *     não calcula nem redefine limiares; delega 100% ao SolidityTrafficLight.
 *
 * SANITIZAÇÃO (obrigatória):
 *   - `skipHtml`: tags HTML cruas na string da IA são ignoradas.
 *   - `allowedElements`: allowlist estrita — só `p`, `strong`, `em`.
 *     Remove vetores de injeção via prompt adversarial (a, img, script…).
 *
 * TIPOGRAFIA (system.md — Institucional Moderno):
 *   - Operacional: Geist Sans (padrão do canvas diário).
 *   - Board-Ready / print: `font-board-report` (Serif) via `presentationMode`,
 *     coerente com a regra "Serif só em board-ready" do sistema.
 *   - Corpo: `text-base` + `leading-[1.65]` — peso de Parecer Executivo.
 *
 * SEPARADOR LADO B (decisão fechada na auditoria — não substituir por whitespace):
 *   - `md:border-l md:border-border/50 md:pl-6` em viewport md+.
 *   - Mobile: sem border-l (evitar barra órfã); `border-t` discreto para
 *     ritmo vertical.
 *
 * SKELETON DE RITMO (obrigatório):
 *   - Três linhas com larguras decrescentes (100 / 95 / 80%).
 *   - Simula anatomia de parágrafo; reduz layout-shift.
 *
 * SEMÁFORO (2.3.1) + DIAGNÓSTICO (2.3.2):
 *   - `SolidityTrafficLight` renderizado acima do diagnóstico.
 *   - `SolidityAggregateDiagnostic` imediatamente abaixo: «voz do auditor».
 *   - Ambos envolvidos por um único `aria-live="polite"` — sem regiões aninhadas.
 *   - Separados do Parecer executivo por um divisor discreto.
 */

import ReactMarkdown from "react-markdown"
import { Skeleton } from "@/components/ui/skeleton"
import { parseConfidenceScore01 } from "@/lib/confidence-tiers"
import { cn } from "@/lib/utils"
import { SolidityAggregateDiagnostic } from "@/components/shared/solidity-aggregate-diagnostic"
import { SolidityTrafficLight } from "@/components/shared/solidity-traffic-light"
import { useLawCorpus } from "@/lib/use-law-corpus"

// ─── Allowlist de elementos Markdown seguros ──────────────────────────────────
// Apenas formatação inline e parágrafos — sem links, imagens ou blocos
// que possam injectar conteúdo via prompt adversarial.
const ALLOWED_MARKDOWN_ELEMENTS: string[] = ["p", "strong", "em"]

// ─── Cópia institucional de fallback ─────────────────────────────────────────
const FALLBACK_EMPTY =
  "Execute a simulação com conta autenticada para ver a fundamentação gerada pelo motor semântico."

const FALLBACK_UNAVAILABLE =
  "Parecer executivo indisponível neste registo. A análise depende do motor semântico (LLM) — verifique se a funcionalidade está activa e execute uma nova simulação."

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface VerdictThesisPanelProps {
  /**
   * Texto bruto do `strategy_insight` vindo do backend.
   * Pode conter Markdown básico (bold, itálico) gerado pelo LLM.
   * PROIBIDO usar para recalcular ou derivar dados financeiros.
   */
  markdown: string | null | undefined
  /**
   * Score bruto de confiança 0–1 (ou string decimal) vindo de
   * `aiMetadata.confidence_score`. Interpretado como metadado de auditoria;
   * o painel não redefine limiares — delega ao SolidityTrafficLight.
   * Omitir ou `null` quando aiMetadata não está disponível.
   */
  scoreRaw?: number | string | null
  /**
   * `aiMetadata.breakdown.evidence_coverage` (0–1): proporção de linhas com
   * pelo menos um fragmento recuperado da lei.
   * Alimenta o Y% / Z% no SolidityAggregateDiagnostic (item 2.3.2).
   * Omitir ou `null` quando breakdown não está disponível.
   */
  evidenceCoverageRaw?: number | null
  /**
   * `true` enquanto o pai aguarda a resposta (POST em curso).
   * Hoje o POST devolve tudo junto, então default é `false`.
   * Mantido para suportar stream / desacoplamento futuro sem quebra de API.
   */
  pending?: boolean
  /** Activa tipografia Board-Ready (font-board-report / Serif). */
  presentationMode?: boolean
  /**
   * 3.4.2 — Quando `true`, o `strategy_insight` exibido pertence à simulação
   * original da IA e pode não reflectir os overrides manuais do consultor.
   * Exibe uma nota institucional subtil (muted, text-[11px]) junto ao parágrafo.
   * Anti-contradição: evita que o consultor apresente texto da IA desalinhado
   * do número novo que o motor Go acabou de calcular.
   */
  thesisIsStale?: boolean
  /**
   * 3.4.2 — Verdadeiro enquanto o motor Go está a recalcular após override.
   * Aplica opacity-40 no corpo do parecer (whisper-quiet): o texto não muda,
   * mas o consultor percebe dependência temporal com os números ao lado.
   * Suprimido em Board-Ready para não poluir o relatório oficial.
   */
  isRecalculating?: boolean
  /** Números ainda não actualizados após override (ex.: debounce do POST). */
  pendingSimulationSync?: boolean
  className?: string
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function VerdictThesisPanel({
  markdown,
  scoreRaw,
  evidenceCoverageRaw,
  pending = false,
  presentationMode = false,
  thesisIsStale = false,
  isRecalculating = false,
  pendingSimulationSync = false,
  className,
}: VerdictThesisPanelProps) {
  const hasText = Boolean(markdown?.trim())
  const syncVisualActive = isRecalculating || pendingSimulationSync
  const { changelog } = useLawCorpus()
  const parsedScore = parseConfidenceScore01(scoreRaw ?? null)
  const parsedCoverage =
    evidenceCoverageRaw != null && Number.isFinite(evidenceCoverageRaw)
      ? evidenceCoverageRaw
      : null

  return (
    <section
      aria-label="Parecer executivo"
      aria-busy={pending}
      className={cn(
        // Separador Lado B — decisão fechada (dossiê de auditoria):
        // borda vertical em md+; mobile usa border-t discreto em vez de barra órfã.
        "border-t border-border/40 pt-5",
        "md:border-l md:border-t-0 md:border-border/50 md:pl-6 md:pt-0",
        // Board-Ready e print: sem borda separadora (A4 limpo, coluna única).
        "board-ready:border-0 board-ready:pl-0 board-ready:pt-0 print:border-0 print:pl-0 print:pt-0",
        className,
      )}
    >
      {/*
       * Bloco de solidez jurídica (2.3.1 + 2.3.2):
       *   - aria-live="polite" único envolve semáforo + diagnóstico,
       *     evitando regiões vivas aninhadas e anúncios duplicados.
       *   - Ordem: SolidityTrafficLight → SolidityAggregateDiagnostic → hr.
       * Renderizado quando scoreRaw foi fornecido ou pending é true.
       */}
      {(scoreRaw != null || pending) && (
        <>
          <div
            aria-live="polite"
            aria-atomic="true"
            className="space-y-2"
          >
            <SolidityTrafficLight
              score={parsedScore}
              pending={pending}
              presentationMode={presentationMode}
            />
            <SolidityAggregateDiagnostic
              score={parsedScore}
              evidenceCoverage01={parsedCoverage}
              pending={pending}
              presentationMode={presentationMode}
            />
          </div>
          <hr className="border-border/50" aria-hidden />
        </>
      )}

      {/* Rótulo da secção */}
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
          presentationMode &&
            "font-board-report normal-case text-sm tracking-normal font-semibold text-foreground",
          "tribia-print-narrative-serif",
        )}
      >
        Parecer executivo
      </p>

      {/* ── Estado: a carregar ──────────────────────────────────────────────── */}
      {pending && (
        // Skeleton de ritmo — três linhas com larguras decrescentes para
        // simular anatomia de parágrafo e eliminar layout shift.
        <div
          role="status"
          aria-label="A carregar parecer executivo"
          className="mt-3 space-y-2"
        >
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-[95%] rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      )}

      {/* ── Estado: texto disponível ────────────────────────────────────────── */}
      {!pending && hasText && (
        <div
          aria-busy={syncVisualActive}
          className={cn(
            // Tipografia de Parecer Executivo — peso de documento oficial.
            // Operacional: Geist (padrão); Board-Ready: font-board-report (Serif).
            "mt-3 text-base leading-[1.65] text-foreground transition-opacity duration-300",
            "[&_p]:mb-3 [&_p:last-child]:mb-0",
            "[&_strong]:font-semibold",
            "[&_em]:italic",
            "tribia-print-narrative-serif",
            presentationMode
              ? "font-board-report"
              : "font-sans",
            // Ambient dim: recálculo em curso ou simulação ainda não sincronizada.
            // Suprimido em Board-Ready.
            syncVisualActive && "opacity-40 board-ready:opacity-100",
          )}
        >
          <ReactMarkdown
            skipHtml
            allowedElements={ALLOWED_MARKDOWN_ELEMENTS}
          >
            {markdown!}
          </ReactMarkdown>
        </div>
      )}

      {/* ── Estado: sem texto (fallback institucional) ──────────────────────── */}
      {!pending && !hasText && (
        <p
          className={cn(
            "mt-3 text-sm leading-relaxed text-muted-foreground",
            presentationMode && "font-board-report",
            "tribia-print-narrative-serif",
          )}
        >
          {markdown === null ? FALLBACK_UNAVAILABLE : FALLBACK_EMPTY}
        </p>
      )}

      {/*
       * Nota de coerência RAG (3.4.2 — anti-contradição consultor/cliente).
       *
       * Exibida quando o consultor aplicou overrides e o motor Go recalculou
       * os números, mas o strategy_insight ainda reflecte a simulação original.
       * Tom: informativo e institucional — Geist Sans, muted, sem ícone
       * carnavalesco (system.md "whisper-quiet"; tribia_core_rules §4 "Honestidade").
       * Board-Ready / print: suprimida para não poluir o relatório oficial.
       */}
      {!pending && hasText && syncVisualActive && (
        <p
          className="mt-2 text-[11px] leading-snug text-amber-800/90 dark:text-amber-200/80 board-ready:hidden print:hidden"
          role="status"
        >
          {isRecalculating
            ? "A sincronizar os números com o motor Go…"
            : "Tese a sincronizar com os números — a simulação ainda reflecte a última decisão de classificação."}
        </p>
      )}

      {!pending && hasText && thesisIsStale && !syncVisualActive && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground/70 board-ready:hidden print:hidden">
          Fundamentação baseada na simulação original da IA · os números acima
          refletem os overrides do consultor
        </p>
      )}

      {/* Proveniência — rastro do dado (tribia_core_rules §2 "Demonstrar") */}
      {!pending && hasText && (
        <p className="mt-3 text-[10px] font-medium text-muted-foreground/80 board-ready:hidden print:hidden">
          Gerado pelo motor semântico · {changelog.label}
        </p>
      )}
    </section>
  )
}
