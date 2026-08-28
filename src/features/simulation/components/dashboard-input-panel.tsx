"use client"

// Extraído de simulation-dashboard.tsx (FE-3, PR 3c) — painel de entrada:
// seletor de modo (form + importers injetados via render-prop), banner de
// comparação A/B, e o corpo (SimulationForm ou o importer ativo). simulation
// não importa features/import: as entries chegam prontas de app/ (mesmo
// padrão do renderDossier da FE-2).
import { useState } from "react"
import { SimulationForm } from "./simulation-form"
import { cn } from "@/lib/utils"
import type { ImportAppliedSummary, ImporterPanelEntry } from "@/lib/importer-contract"
import type { FormExpense, FormService } from "@/types/api"

// Etapa N/PR 5 — a coluna `tipo` opcional do importer CSV agora pode trazer
// receitas junto das despesas; o banner passa a nomear os dois em vez de só
// "despesa(s) importada(s)".
function formatImportSummary(summary: ImportAppliedSummary): string {
  const parts: string[] = []
  if (summary.servicesCount > 0) {
    parts.push(`${summary.servicesCount} receita${summary.servicesCount === 1 ? "" : "s"}`)
  }
  if (summary.expensesCount > 0) {
    parts.push(`${summary.expensesCount} despesa${summary.expensesCount === 1 ? "" : "s"}`)
  }
  const total = summary.servicesCount + summary.expensesCount
  const suffix = summary.fileName ? ` de ${summary.fileName}` : ""
  return `${parts.join(" e ")} importada${total === 1 ? "" : "s"}${suffix}.`
}

export interface DashboardInputPanelProps {
  importerEntries: ImporterPanelEntry[]
  isComparing: boolean
  loading: boolean
  onFormSubmit: (year: number, services: FormService[], expenses: FormExpense[], companyContext: string) => void
  /** Chamado ao trocar de modo — mesma semântica do reset() antigo: limpa comparação/falha da máquina. */
  onModeChange: () => void
}

export function DashboardInputPanel({
  importerEntries,
  isComparing,
  loading,
  onFormSubmit,
  onModeChange,
}: DashboardInputPanelProps) {
  const [activeId, setActiveId] = useState<string>("form")
  const [importedSummary, setImportedSummary] = useState<ImportAppliedSummary | null>(null)

  const entries: { id: string; label: string }[] = [
    { id: "form", label: "Simulação Manual" },
    ...importerEntries.map((e) => ({ id: e.id, label: e.label })),
  ]
  const activeImporter = importerEntries.find((e) => e.id === activeId)

  function selectMode(id: string) {
    if (id === activeId) return
    setActiveId(id)
    setImportedSummary(null)
    onModeChange()
  }

  function handleApplied(summary: ImportAppliedSummary) {
    setImportedSummary(summary)
    setActiveId("form")
  }

  return (
    <div id="tribia-sim-input" className="scroll-mt-24 space-y-4">
      {entries.length > 1 && (
        <div className="inline-flex shrink-0 rounded-lg border bg-muted p-1 gap-0.5">
          {entries.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => selectMode(e.id)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                activeId === e.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      )}

      {isComparing && activeId === "form" && (
        <div
          className="rounded-xl border border-emerald-500/30 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-950/30 dark:text-emerald-100"
          role="status"
        >
          <p className="font-semibold">Comparação A/B ativa</p>
          <p className="mt-1 text-xs text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
            Ajuste ano, regime ou dados e execute uma nova simulação para ver o cenário B ao lado da referência
            congelada.
          </p>
        </div>
      )}

      {importedSummary && activeId === "form" && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm" role="status">
          <p className="font-medium">{formatImportSummary(importedSummary)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {importedSummary.servicesCount > 0
              ? "Revise os itens abaixo e simule."
              : "Revise os itens abaixo e complete as receitas para simular."}
          </p>
        </div>
      )}

      {activeId === "form" ? (
        <SimulationForm onSubmit={onFormSubmit} loading={loading} />
      ) : (
        activeImporter?.render({ onApplied: handleApplied })
      )}
    </div>
  )
}
