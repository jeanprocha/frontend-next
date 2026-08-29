"use client"

/**
 * Intent: consultor / CFO em auditoria; escaneia rapidamente quais linhas foram
 * validadas manualmente (ShieldCheck emerald) vs. só pela IA, e pode substituir
 * qualquer classificação sem reexecutar o batch RAG.
 *
 * Palette: Slate/Navy (fundo/texto) + Emerald-500 para override confirmado
 * (linguagem de "segurança jurídica" consistente com o veredito de solidez 2.3.2).
 * Sem emerald decorativo — só onde houver evento de auditoria.
 *
 * Depth: borders-only — densidade de ferramenta de auditoria.
 * Typography: Geist Sans (operação). font-board-report (serif) APENAS no
 * conteúdo do tooltip em presentationMode ("Validação humana realizada").
 * Spacing: múltiplos de 4px (base mental Tailwind).
 */

import { memo, useMemo } from "react"
import { Droplet } from "lucide-react"

import { ClassificationOverrideCell } from "./classification-override-cell"
import { ExpenseSemanticConfidenceDot } from "./expense-semantic-confidence-dot"
import { GlossaryHelpTrigger } from "@/components/shared/glossary-help-trigger"

import { formatBRL } from "@/lib/format-money"
import { findCreditLeakForRow } from "@/lib/credit-leak-match"
import { hasConsultantOverride } from "@/lib/classification-effective"
import { cn } from "@/lib/utils"
import type {
  ClassificationItem,
  ConsultantClassificationOverride,
  CreditLeak,
  FormExpense,
} from "@/types/api"

// ─── Conteúdo do tooltip de vazamento ────────────────────────────────────────

function LeakTooltipContent({ leak }: { leak: CreditLeak }) {
  const reason = leak.reason?.trim() || "—"
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-foreground">Custo não-recuperável</p>
      <p className="font-mono tabular-nums text-xs text-foreground">
        {formatBRL(leak.lost_credit)}
      </p>
      <p className="text-xs leading-snug text-muted-foreground">{reason}</p>
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ExpenseSemanticAuditTableProps {
  expenses: FormExpense[]
  classifications: ClassificationItem[]
  creditLeaks?: CreditLeak[]
  presentationMode?: boolean
  ariaDescribedBy?: string
  /**
   * Chamado quando o consultor confirma um override.
   * clientId: id da despesa (FormExpense.id).
   */
  onApplyOverride?: (
    clientId: string,
    override: ConsultantClassificationOverride,
  ) => void
  /** Chamado quando o consultor remove um override (restaura sugestão IA). */
  onRemoveOverride?: (clientId: string) => void
}

// Override popover/sheet por linha: extraído para ./classification-override-cell.tsx
// (PR de extração — mantém este arquivo abaixo do teto de 300 linhas).

/** Célula do gauge (IA) + canal manual — repinta só quando a classificação da linha muda. */
const ClassificationSignalCell = memo(
  function ClassificationSignalCell({
    classification,
    presentationMode,
  }: {
    classification: ClassificationItem | null
    presentationMode: boolean
  }) {
    if (!classification) {
      return <span className="text-xs text-muted-foreground">—</span>
    }
    const hasErr = Boolean(classification.error?.trim())
    if (hasErr) {
      return <span className="text-xs text-muted-foreground">—</span>
    }
    return (
      <ExpenseSemanticConfidenceDot
        score={classification.confidence}
        justification={classification.justification}
        error={classification.error}
        presentationMode={presentationMode}
        hasConsultantOverride={hasConsultantOverride(classification)}
      />
    )
  },
  (prev, next) =>
    prev.classification === next.classification &&
    prev.presentationMode === next.presentationMode,
)

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * Tabela compacta de rastreabilidade (item 3.1.1) + alerta de vazamento (3.3.1) +
 * mecânica de override manual (3.4.1).
 *
 * Prova o rastro: Descrição → Classificação (IA ou Consultor) → Valor.
 * Soberania do consultor: badge clicável → Smart List → ShieldCheck emerald.
 * Board-Ready: edição oculta; ShieldCheck + tooltip em serif permanecem.
 */
export function ExpenseSemanticAuditTable({
  expenses,
  classifications,
  creditLeaks,
  presentationMode = false,
  ariaDescribedBy,
  onApplyOverride,
  onRemoveOverride,
}: ExpenseSemanticAuditTableProps) {
  const hasLeakData = Boolean(creditLeaks?.length)

  const rows = useMemo(
    () =>
      expenses.map((exp) => ({
        ...exp,
        classification:
          classifications.find((c) => c.client_id === exp.id) ??
          classifications.find((c) => c.description === exp.description) ??
          null,
        leak: findCreditLeakForRow(creditLeaks, exp.description),
      })),
    [expenses, classifications, creditLeaks],
  )

  if (expenses.length === 0) {
    return (
      <div
        role="status"
        className="rounded-lg border border-border/60 bg-muted/15 px-4 py-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Nenhuma despesa detalhada nesta simulação.
        </p>
      </div>
    )
  }

  return (
    <>
    {/* Affordance de rolagem: no celular a tabela rola de lado e descrição/valor
        saíam da tela sem nenhum indício (achado do critique). */}
    <p className="pb-1 text-[11px] text-muted-foreground sm:hidden print:hidden" aria-hidden>
      Deslize a tabela para o lado para ver todas as colunas →
    </p>
    <div
      className="overflow-x-auto rounded-lg border border-border/70"
      {...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {})}
    >
      <table className="w-full text-sm">
        <caption className="sr-only">
          Despesas e classificação semântica para rastreabilidade de auditoria. Coluna
          Sinal: confiança da análise IA; ícone de escudo quando a linha foi curada
          manualmente.
          {hasLeakData
            ? " Linhas com borda vermelha à esquerda indicam custo morto."
            : ""}
        </caption>

        <thead>
          <tr className="border-b border-border/70 bg-muted/30">
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Descrição
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Classificação
              {!presentationMode && (
                <span className="ml-1 font-normal normal-case tracking-normal text-[10px] text-muted-foreground/60">
                  (clique para substituir)
                </span>
              )}
            </th>
            <th
              scope="col"
              className="w-[1%] px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap"
            >
              Sinal
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground tabular-nums"
            >
              Valor (R$)
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const leak = row.leak
            const hasLeak = leak !== null

            return (
              <tr
                key={row.id}
                className={cn(
                  "group border-b border-border/60 last:border-0",
                  "transition-colors hover:bg-muted/20",
                  hasLeak
                    ? "border-l-2 border-l-[var(--tribia-verdict-increase-fg)]"
                    : "border-l-2 border-l-transparent",
                )}
              >
                {/* Descrição */}
                <td
                  className="max-w-[16rem] px-3 py-2 font-medium text-foreground"
                  title={row.description}
                >
                  <span className="line-clamp-1">{row.description}</span>
                </td>

                {/* Classificação + override */}
                <td className="px-3 py-2 text-center">
                  <ClassificationOverrideCell
                    row={row}
                    presentationMode={presentationMode}
                    onApplyOverride={onApplyOverride}
                    onRemoveOverride={onRemoveOverride}
                  />
                </td>

                <td className="px-2 py-2 text-center">
                  <ClassificationSignalCell
                    classification={row.classification}
                    presentationMode={presentationMode}
                  />
                </td>

                {/* Valor */}
                <td className="px-3 py-2 text-right">
                  <span className="inline-flex items-center justify-end gap-1.5">
                    {hasLeak && (
                      <GlossaryHelpTrigger
                        ariaLabel="Vazamento de crédito identificado nesta despesa"
                        sheetTitle="Custo não-recuperável"
                        content={<LeakTooltipContent leak={leak} />}
                        side="top"
                        preferSheetOnTouch
                        className="shrink-0"
                      >
                        <Droplet
                          className="size-3.5 text-[var(--tribia-verdict-increase-fg)]"
                          aria-hidden
                        />
                      </GlossaryHelpTrigger>
                    )}

                    {hasLeak && presentationMode && (
                      <span className="font-board-report text-[10px] text-[var(--tribia-verdict-increase-fg)] opacity-80 shrink-0">
                        Custo não-recuperável
                      </span>
                    )}

                    <span
                      className={cn(
                        "font-mono tabular-nums text-foreground",
                        presentationMode ? "font-semibold" : "font-medium",
                      )}
                    >
                      {formatBRL(row.amount)}
                    </span>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}
