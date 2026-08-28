/**
 * CSV audit-ready do dossiê (Etapa M/PR 7) — cumpre a promessa "Exportação
 * CSV (audit-ready)" da landing antiga (removida na reescrita da PR 10 por
 * não existir ainda; agora existe). Uma linha por despesa, com a mesma
 * classificação que a Mesa de operações mostra: descrição, valor,
 * classificação da IA, decisão efetiva (override do consultor quando
 * houver), confiança e a citação legal — tudo já presente no snapshot,
 * nada computado de novo aqui.
 *
 * Delimitador ";" (não ","): valores monetários usam vírgula decimal
 * (formatBRL, convenção do produto inteiro) — com "," como delimitador de
 * campo, cada valor quebraria em duas colunas ao abrir no Excel PT-BR.
 * ";" é o separador de lista regional que o Excel brasileiro já espera.
 */
import { formatBRL } from "./format-money"
import { aggregatedScoreToPercent } from "./confidence-tiers"
import {
  getAiSuggestedLabel,
  getEffectiveLabel,
  hasConsultantOverride,
} from "./classification-effective"
import type { ClassificationItem, FormExpense } from "@/types/api"

const CSV_BOM = "﻿"
const HEADER = ["Descrição", "Valor (R$)", "Classificação da IA", "Decisão efetiva", "Confiança", "Base legal"]

function csvField(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function matchClassification(
  exp: FormExpense,
  classifications: ClassificationItem[],
): ClassificationItem | null {
  return (
    classifications.find((c) => c.client_id === exp.id) ??
    classifications.find((c) => c.description === exp.description) ??
    null
  )
}

export function buildAuditCsv(expenses: FormExpense[], classifications: ClassificationItem[]): string {
  const rows = expenses.map((exp) => {
    const c = matchClassification(exp, classifications)
    const confidencePct = c ? `${aggregatedScoreToPercent(c.confidence)}%` : "—"
    const legalBase = c?.legal_base?.trim() || "—"
    const decisaoEfetiva = c ? getEffectiveLabel(c) : "Sem classificação"
    const iaSugeriu = c ? getAiSuggestedLabel(c) : "—"
    const decisaoComNota =
      c && hasConsultantOverride(c) ? `${decisaoEfetiva} (curado pelo consultor)` : decisaoEfetiva

    return [exp.description, formatBRL(exp.amount), iaSugeriu, decisaoComNota, confidencePct, legalBase]
  })

  const lines = [HEADER, ...rows].map((row) => row.map(csvField).join(";"))
  // BOM UTF-8 — sem ele o Excel no Windows lê acentuação PT-BR errado.
  return CSV_BOM + lines.join("\r\n") + "\r\n"
}
