"use client"

import { useState } from "react"
import { SimulationHistory } from "@/components/tax/simulation-history"
import { SimulationForm } from "@/components/tax/simulation-form"
import { SummaryCards } from "@/components/tax/summary-cards"
import { ExpenseTable } from "@/components/tax/expense-table"
import { UploadZone, type UploadResult } from "@/components/tax/upload-zone"
import { CsvSummary } from "@/components/tax/csv-summary"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTaxStore, type PersistedResults } from "@/store/useTaxStore"
import { useSimulationMutation } from "@/hooks/use-simulation"
import type {
  ClassificationItem,
  FormExpense,
  FormService,
} from "@/types/api"

// ─── Tipos ───────────────────────────────────────────────────────────────────

// Resultado de CSV não persiste — depende de arquivo local efêmero.
interface CsvResults {
  mode: "csv"
  expenses: FormExpense[]
  classifications: ClassificationItem[]
}

type InputMode = "form" | "csv"

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [inputMode, setInputMode] = useState<InputMode>("form")

  // Resultado de CSV: estado local efêmero
  const [csvResults, setCsvResults] = useState<CsvResults | null>(null)

  // Resultado de formulário: lido do Zustand (persistido no localStorage)
  const { results: formResults, setResults: setFormResults } = useTaxStore()

  // TanStack Query: substitui useState(loading) + useState(error) + try/catch
  const mutation = useSimulationMutation()
  const loading = mutation.isPending
  const error = mutation.error?.message ?? null

  // Vista unificada: CSV tem prioridade enquanto ativo, senão mostra form
  const results: PersistedResults | CsvResults | null =
    csvResults ?? formResults ?? null

  // ── Fluxo Formulário ─────────────────────────────────────────────────────
  // handleFormSubmit agora delega o trabalho pesado ao hook de mutação.
  // A lógica de classify → simulate → setFormResults vive em use-simulation.ts.
  function handleFormSubmit(
    year: number,
    services: FormService[],
    expenses: FormExpense[],
    companyContext: string,
  ) {
    setCsvResults(null)
    mutation.mutate({ year, services, expenses, companyContext })
  }

  // ── Fluxo CSV (inalterado) ───────────────────────────────────────────────
  function handleCsvResult(result: UploadResult) {
    setCsvResults({
      mode: "csv",
      expenses: result.expenses,
      classifications: result.classifications,
    })
    mutation.reset()
  }

  function handleCsvError(msg: string) {
    // Exibe o erro diretamente no JSX via estado local para o CSV
    setCsvResults(null)
    // Reutiliza o estado de erro do mutation para exibição uniforme
    mutation.reset()
    // Erro de CSV é tratado abaixo via csvError state
    setCsvError(msg)
  }

  const [csvError, setCsvError] = useState<string | null>(null)

  // ── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    setCsvResults(null)
    setCsvError(null)
    setFormResults(null)
    mutation.reset()   // limpa isPending / error do TanStack
  }

  const displayError = error ?? csvError

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">Simulador de Reforma Tributária</h1>
            <p className="text-sm text-muted-foreground">
              Calcule o impacto da transição CBS/IBS com classificação de créditos por IA — LC 68/2024.
            </p>
          </div>

          {/* Segmented control — só aparece quando não há resultado */}
          {!results && (
            <div className="inline-flex shrink-0 rounded-lg border bg-muted p-1 gap-0.5">
              {(["form", "csv"] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setInputMode(m); reset() }}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                    inputMode === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "form" ? "Simulação Manual" : "Upload de CSV"}
                </button>
              ))}
            </div>
          )}

          {/* Botão de reset quando há resultado */}
          {results && (
            <Button variant="outline" size="sm" onClick={reset} className="shrink-0">
              ← {results.mode === "form" ? "Nova simulação" : "Novo arquivo"}
            </Button>
          )}
        </div>

        {/* ── Erro ───────────────────────────────────────────────────────── */}
        {displayError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <strong>Erro:</strong> {displayError}
          </div>
        )}

        <SimulationHistory onBeforeHydrate={() => setCsvResults(null)} />

        {/* ── Entrada: Formulário ─────────────────────────────────────────── */}
        {inputMode === "form" && !results && !loading && (
          <SimulationForm onSubmit={handleFormSubmit} loading={loading} />
        )}

        {/* ── Entrada: Upload CSV ─────────────────────────────────────────── */}
        {inputMode === "csv" && !results && (
          <UploadZone
            companyContext="Empresa SaaS B2B, regime regular IBS/CBS"
            onResult={handleCsvResult}
            onError={handleCsvError}
          />
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-2.5 w-36" />
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-white p-5 space-y-2.5">
              <Skeleton className="h-4 w-44" />
              <div className="rounded-lg border overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-20 ml-auto" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Resultados ─────────────────────────────────────────────────── */}
        {!loading && results && (
          <div className="space-y-6">

            {/* Cards — modo formulário */}
            {results.mode === "form" && (
              <div>
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Comparativo Tributário — {results.simulation.year}
                </h2>
                <SummaryCards result={results.simulation} />
              </div>
            )}

            {/* Cards — modo CSV */}
            {results.mode === "csv" && (
              <div>
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                  Resumo da Classificação — {results.expenses.length} despesas processadas
                </h2>
                <CsvSummary
                  expenses={results.expenses}
                  classifications={results.classifications}
                />
              </div>
            )}

            {/* Tabela de despesas */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30">
                <h2 className="text-sm font-semibold">Análise de Créditos — IA</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clique em "Ver lei" para consultar os artigos da LC 68/2024 usados pela IA na classificação.
                </p>
              </div>
              <ExpenseTable
                expenses={results.expenses}
                classifications={results.classifications}
              />
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
