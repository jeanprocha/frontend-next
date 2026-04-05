"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { History, Monitor, Presentation } from "lucide-react"
import { SimulationForm } from "@/components/tax/simulation-form"
import { SummaryCards } from "@/components/tax/summary-cards"
import { TribiaInsights } from "@/components/tax/tribia-insights"
import { TransitionChart } from "@/components/tax/transition-chart"
import { SankeyFlow } from "@/components/tax/sankey-flow"
import { CreditLeakageAlert } from "@/components/tax/credit-leakage-alert"
import { ExpenseTable } from "@/components/tax/expense-table"
import { UploadZone, type UploadResult } from "@/components/tax/upload-zone"
import { CsvSummary } from "@/components/tax/csv-summary"
import { Skeleton } from "@/components/ui/skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTaxStore, type PersistedResults } from "@/store/useTaxStore"
import { useSimulationMutation } from "@/hooks/use-simulation"
import { useBoardReady } from "@/hooks/use-board-ready"
import {
  BoardReadyHeader,
  BoardReadyWatermark,
} from "@/components/tax/board-ready-header"
import { PrintButton } from "@/components/tax/print-button"
import {
  PrintReportFooter,
  PrintReportHeader,
} from "@/components/tax/print-report-chrome"
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
  const { isBoardReady, setIsBoardReady, toggleBoardReady } = useBoardReady()
  const [inputMode, setInputMode] = useState<InputMode>("form")

  // Resultado de CSV: estado local efêmero
  const [csvResults, setCsvResults] = useState<CsvResults | null>(null)

  // Resultado de formulário: lido do Zustand (persistido no localStorage)
  const {
    results: formResults,
    setResults: setFormResults,
    companyRegime,
    imobiliarioRedutorAjusteBrl,
    services,
  } = useTaxStore()

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
    mutation.mutate({
      year,
      services,
      expenses,
      companyContext,
      companyRegime,
      imobiliarioRedutorAjusteBrl,
    })
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
    setIsBoardReady(false)
    setCsvResults(null)
    setCsvError(null)
    setFormResults(null)
    mutation.reset()   // limpa isPending / error do TanStack
  }

  const displayError = error ?? csvError

  const boardReadyActive =
    isBoardReady && results?.mode === "form"

  useEffect(() => {
    if (!results || results.mode !== "form") {
      setIsBoardReady(false)
    }
  }, [results, setIsBoardReady])

  return (
    <main className="min-h-screen bg-slate-50/50 relative">
      {results?.mode === "form" && <BoardReadyWatermark />}
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 py-8 space-y-6",
          boardReadyActive && "board-ready:max-w-5xl",
        )}
      >
        {results?.mode === "form" && (
          <>
            <PrintReportHeader generatedAtIso={formResults?.meta?.createdAt} />
            <BoardReadyHeader
              companyContext={
                formResults?.meta?.companyContext ?? undefined
              }
              year={results.simulation.year}
              createdAtIso={formResults?.meta?.createdAt ?? null}
            />
          </>
        )}

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-end gap-3",
            boardReadyActive ? "sm:justify-end" : "sm:justify-between",
          )}
        >
          <div
            className={cn(
              "space-y-0.5",
              results?.mode === "form" && "board-ready:hidden",
            )}
          >
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

          {/* Botões quando há resultado */}
          {results && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
              {results.mode === "form" && formResults?.meta && (
                <Link
                  href="/dashboard/history"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "board-ready:hidden no-print print:hidden",
                  )}
                >
                  Voltar ao histórico
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="board-ready:hidden no-print print:hidden"
              >
                ← {results.mode === "form" ? "Nova simulação" : "Novo arquivo"}
              </Button>
              {results.mode === "form" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={toggleBoardReady}
                  className="no-print print:hidden gap-1.5"
                  aria-pressed={isBoardReady}
                >
                  {isBoardReady ? (
                    <>
                      <Monitor className="h-4 w-4" aria-hidden />
                      Modo edição
                    </>
                  ) : (
                    <>
                      <Presentation className="h-4 w-4" aria-hidden />
                      Modo apresentação
                    </>
                  )}
                </Button>
              )}
              {boardReadyActive && <PrintButton />}
            </div>
          )}
        </div>

        {/* ── Erro ───────────────────────────────────────────────────────── */}
        {displayError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            <strong>Erro:</strong> {displayError}
          </div>
        )}

        {/* ── Banner: simulação carregada do histórico ─────────────────── */}
        {formResults?.meta && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 board-ready:hidden">
            <div className="flex items-start gap-2.5 min-w-0">
              <History className="h-4 w-4 shrink-0 text-accent mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-accent">Simulação do histórico</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {new Date(formResults.meta.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}Ano {formResults.meta.year}
                  {formResults.meta.companyContext
                    ? ` · ${formResults.meta.companyContext.slice(0, 60)}${formResults.meta.companyContext.length > 60 ? "…" : ""}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        )}

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
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide board-ready:font-serif board-ready:text-lg board-ready:normal-case board-ready:text-foreground">
                  Comparativo Tributário — {results.simulation.year}
                </h2>
                <SummaryCards result={results.simulation} />
                <div className="mt-4">
                  <TribiaInsights result={results.simulation} />
                </div>
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 board-ready:grid-cols-1 board-ready:gap-10">
                  <TransitionChart result={results.simulation} />
                  <SankeyFlow
                    simulation={results.simulation}
                    expenses={results.expenses}
                    services={services}
                  />
                </div>
                <CreditLeakageAlert result={results.simulation} />
              </div>
            )}

            {/* Cards — modo CSV */}
            {results.mode === "csv" && (
              <div>
                <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide board-ready:font-serif board-ready:text-lg board-ready:normal-case board-ready:text-foreground">
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
                <h2 className="text-sm font-semibold board-ready:font-serif board-ready:text-base">
                  Análise de Créditos — IA
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 board-ready:hidden">
                  Clique em &quot;Ver lei&quot; para consultar os artigos da LC 68/2024 usados pela IA na classificação.
                </p>
              </div>
              <ExpenseTable
                expenses={results.expenses}
                classifications={results.classifications}
                presentationMode={boardReadyActive}
              />
            </div>

            {results.mode === "form" && <PrintReportFooter />}

          </div>
        )}
      </div>
    </main>
  )
}
