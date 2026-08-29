/**
 * aggregate-solidity-diagnostic.ts — item 2.3.2
 *
 * Camada pura (sem dependências de React) que transforma o score 0–1 e os
 * metadados de cobertura RAG em mensagens institucionais de diagnóstico.
 *
 * CONTRATOS (tribia_core_rules §1):
 *   - Tier derivado EXCLUSIVAMENTE de `confidenceTierFromScore01`.
 *   - PROIBIDO literais 0.85 / 0.60 nesta lógica de mensagem.
 *   - Y% e Z% são métricas de interface sobre cobertura de evidências (RAG);
 *     NÃO são cálculos fiscais — não derivam impostos nem séries temporais.
 *   - O percentual citado na frase é SEMPRE `aggregatedScoreToPercent(score)`
 *     — o mesmo número que `SolidityTrafficLight` desenha na barra ao lado
 *     (`components/shared/solidity-traffic-light.tsx`). Antes, a frase
 *     preferia `evidence_coverage` quando disponível — uma métrica distinta
 *     que diverge do score (achado do critique 2026-08-29: barra em 92%
 *     convivendo com "cerca de 100%" na frase vizinha, "duas verdades na
 *     mesma dobra"). `resolveReviewPercentForDiagnostic` /
 *     `resolveAdherencePercentForDiagnostic` continuam exportadas (têm testes
 *     e uso próprios) mas não alimentam mais esta mensagem.
 *
 * VOZ (system.md — Institucional Moderno):
 *   - Léxico de dossié / auditoria: admissibilidade, divergência interpretativa,
 *     risco de enquadramento, aderência à lei recuperada.
 *   - PROIBIDO: alarmismo, tom emocional, linguagem de chatbot.
 *   - Sem afirmar «jurisprudência pacificada» — o produto é RAG sobre a legislação ingerida.
 */

import {
  aggregatedScoreToPercent,
  confidenceTierFromScore01,
  type ConfidenceTier,
} from "./confidence-tiers"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DiagnosticMessageInput {
  /** Score normalizado 0–1 (já parseado e clampado). */
  score: number
  /**
   * `breakdown.evidence_coverage` da API: proporção de linhas com pelo menos
   * um fragmento recuperado da lei (0–1). Null quando indisponível.
   *
   * Mantido no contrato por compatibilidade com os chamadores (ex.:
   * `SolidityAggregateDiagnostic`) mas não alimenta mais a frase — o
   * percentual citado é sempre `aggregatedScoreToPercent(score)`, o mesmo da
   * barra de solidez (ver nota no topo do arquivo).
   */
  evidenceCoverage01: number | null | undefined
  /**
   * true = Pro / Premium: inclui Y% (ou Z%) na mensagem.
   * false = Free: mensagem mais sintética, sem percentagens de cobertura.
   */
  isPro: boolean
}

export interface DiagnosticMessageResult {
  tier: ConfidenceTier
  /** Frase institucional principal (pode conter números se isPro). */
  message: string
  /**
   * Percentagem de linhas que exigem atenção (âmbar / vermelho, Pro).
   * `null` em Free ou quando não aplicável para o tier.
   */
  reviewPct: number | null
  /**
   * Percentagem de linhas com fundamento recuperado (verde, Pro).
   * `null` em Free ou tiers não-verdes.
   */
  adherencePct: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/**
 * Percentagem de fundamentos que **exigem atenção** (para âmbar / vermelho).
 *
 * Preferência: `evidence_coverage` (linhas sem fundamento = 1 - coverage).
 * Fallback: (1 - score) quando cobertura indisponível.
 */
export function resolveReviewPercentForDiagnostic(
  score: number,
  evidenceCoverage01: number | null | undefined,
): number {
  if (evidenceCoverage01 != null && Number.isFinite(evidenceCoverage01)) {
    return Math.round(clamp01(1 - evidenceCoverage01) * 100)
  }
  return Math.round(clamp01(1 - score) * 100)
}

/**
 * Percentagem de linhas **com** fundamento recuperado (para verde Pro).
 * Usa `evidence_coverage` directamente; fallback em score.
 */
export function resolveAdherencePercentForDiagnostic(
  score: number,
  evidenceCoverage01: number | null | undefined,
): number {
  if (evidenceCoverage01 != null && Number.isFinite(evidenceCoverage01)) {
    return Math.round(clamp01(evidenceCoverage01) * 100)
  }
  return aggregatedScoreToPercent(score)
}

// ─── Mensagens ───────────────────────────────────────────────────────────────

/**
 * Constrói a frase de posicionamento institucional do diagnóstico agregado.
 * Única função que mapeia tier → copy — centraliza a voz do auditor.
 */
export function buildAggregateSolidityDiagnosticMessage(
  input: DiagnosticMessageInput,
): DiagnosticMessageResult {
  // evidenceCoverage01 permanece em DiagnosticMessageInput (contrato externo)
  // mas não é lido aqui — ver o JSDoc do campo.
  const { score, isPro } = input
  const tier = confidenceTierFromScore01(score)

  switch (tier) {
    case "green": {
      // Mesmo número da barra de solidez (score) — nunca evidence_coverage,
      // que é outra métrica e pode divergir (ver nota no topo do arquivo).
      const adherencePct = isPro ? aggregatedScoreToPercent(score) : null

      const message =
        isPro && adherencePct != null
          ? `Solidez jurídica elevada — cerca de ${adherencePct}% das linhas com fundamento ancorado na lei recuperada.`
          : "Admissibilidade elevada. Os fundamentos desta simulação apresentam alta aderência à lei recuperada."

      return { tier, message, reviewPct: null, adherencePct }
    }

    case "yellow": {
      // Complemento do mesmo score da barra (100% − solidez), não evidence_coverage.
      const reviewPct = isPro ? 100 - aggregatedScoreToPercent(score) : null

      const message =
        isPro && reviewPct != null
          ? `Divergência interpretativa identificada — cerca de ${reviewPct}% dos fundamentos exigem revisão manual antes de conclusões perante terceiros.`
          : "Ambiguidade interpretativa detectada. Recomenda-se revisão dos fundamentos antes de conclusões perante terceiros."

      return { tier, message, reviewPct, adherencePct: null }
    }

    case "red": {
      const reviewPct = isPro ? 100 - aggregatedScoreToPercent(score) : null

      const message =
        isPro && reviewPct != null
          ? `Risco de enquadramento — cerca de ${reviewPct}% dos fundamentos apresentam baixa aderência à lei recuperada. Validação jurídica especializada é indispensável.`
          : "Risco de enquadramento identificado. Os fundamentos apresentam baixa aderência à lei recuperada. Validação jurídica especializada é indispensável."

      return { tier, message, reviewPct, adherencePct: null }
    }
  }
}
