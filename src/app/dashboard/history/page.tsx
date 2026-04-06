"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, FileClock, FileDown, Loader2 } from "lucide-react"
import {
  downloadSimulationReport,
  formatBRL,
  getSimulationRecord,
  listSimulationRecords,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { aggregateRagMetadata } from "@/lib/rag-metadata"
import { useTaxStore } from "@/store/useTaxStore"
import type { ClassificationItem, FormExpense } from "@/types/api"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export default function HistoryPage() {
  const router = useRouter()
  const { userId, isLoaded, getToken } = useAuth()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const {
    setYear,
    setCompanyContext,
    setServices,
    setExpenses,
    setResults: setFormResults,
  } = useTaxStore()

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["simulation-records", userId],
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return listSimulationRecords(token, userId, 100)
    },
    enabled: isLoaded && !!userId,
  })

  async function handleOpenRecord(id: string, createdAt: string, companyContext: string | null | undefined, year: number) {
    if (!userId) return
    setLoadingId(id)
    setLoadError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Não autenticado")
      const d = await getSimulationRecord(token, userId, id)
      setYear(d.year)
      setCompanyContext(d.company_context)
      setServices(d.services)
      const classifications: ClassificationItem[] = d.classifications.map((c) => ({
        ...c,
        evidence: c.evidence ?? [],
      }))
      const expenses: FormExpense[] = d.expenses.map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
      }))
      setExpenses(expenses)
      const ai_metadata = aggregateRagMetadata([], classifications)
      setFormResults({
        mode: "form",
        simulation: d.simulation,
        classifications,
        expenses,
        ai_metadata: ai_metadata ?? null,
        meta: {
          createdAt,
          companyContext: companyContext ?? "",
          year,
        },
      })
      router.push("/dashboard")
    } catch (e) {
      console.error("[TribIA] Erro ao carregar simulação:", e)
      setLoadError("Não foi possível carregar esta simulação. Tente novamente.")
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDownloadPDF(id: string) {
    setPdfError(null)
    setPdfLoadingId(id)
    try {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      await downloadSimulationReport(token, userId, id)
    } catch (e) {
      setPdfError((e as Error).message)
    } finally {
      setPdfLoadingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao simulador
          </Link>
        </div>

        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileClock className="h-6 w-6 text-muted-foreground" />
            Histórico de Simulações
          </h1>
          <p className="text-sm text-muted-foreground">
            Clique em uma simulação para recarregá-la no painel do simulador.
          </p>
        </div>

        {/* ── Erro de carregamento de item ─────────────────────────────── */}
        {loadError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}
        {pdfError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {pdfError}
          </div>
        )}

        {/* ── Lista ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-16 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando histórico…
            </div>
          )}

          {isError && (
            <p className="text-sm text-destructive px-6 py-8">
              {(error as Error).message}
            </p>
          )}

          {!isPending && !isError && (!data || data.length === 0) && (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground opacity-60">
              <FileClock className="h-10 w-10" aria-hidden />
              <p className="text-sm font-medium">Nenhuma simulação salva ainda.</p>
              <p className="text-xs text-center max-w-xs">
                Rode uma simulação no painel para criar o primeiro registro.
              </p>
              <Link
                href="/dashboard"
                className="mt-2 text-xs underline underline-offset-2 hover:opacity-80"
              >
                Ir para o simulador
              </Link>
            </div>
          )}

          {!isPending && data && data.length > 0 && (
            <ul className="divide-y divide-border">
              {data.map((row) => {
                const isThisLoading = loadingId === row.id
                const deltaNum = parseFloat(row.delta_impact)
                const deltaNeutral = !Number.isFinite(deltaNum) || deltaNum === 0
                const deltaSaving = deltaNum < 0

                return (
                  <li key={row.id} className="flex items-stretch gap-1 px-1 py-1">
                    <button
                      type="button"
                      disabled={isThisLoading}
                      onClick={() =>
                        void handleOpenRecord(
                          row.id,
                          row.created_at,
                          row.company_context,
                          row.year,
                        )
                      }
                      className={cn(
                        "min-w-0 flex-1 text-left px-4 py-4 hover:bg-muted/50 transition-colors",
                        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2",
                        isThisLoading && "opacity-60 cursor-wait",
                      )}
                    >
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(row.created_at)}
                        </span>
                        <p className="text-sm font-medium mt-0.5">
                          Ano {row.year}
                          {row.company_context
                            ? ` · ${truncate(row.company_context, 60)}`
                            : ""}
                        </p>
                      </div>

                      <div className="text-xs sm:text-right shrink-0 flex flex-col sm:items-end gap-1 pl-5 sm:pl-0">
                        {isThisLoading ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Carregando…</span>
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="text-muted-foreground">Projetado líquido </span>
                              <span className="font-mono font-semibold">
                                {formatBRL(row.total_projected_tax)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground mr-1">Δ</span>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-0.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-full",
                                  deltaNeutral
                                    ? "bg-muted/60 text-muted-foreground"
                                    : deltaSaving
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                      : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
                                )}
                              >
                                {deltaNeutral ? "→ " : deltaSaving ? "↓ " : "↑ "}
                                {formatBRL(row.delta_impact)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-auto min-h-14 w-10 shrink-0 self-stretch sm:self-center mr-2"
                      title="Baixar diagnóstico (PDF)"
                      aria-label="Baixar diagnóstico em PDF"
                      disabled={isThisLoading || pdfLoadingId === row.id}
                      onClick={() => void handleDownloadPDF(row.id)}
                    >
                      {pdfLoadingId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <FileDown className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {data && data.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {data.length} {data.length === 1 ? "simulação" : "simulações"} salvas
          </p>
        )}
      </div>
    </main>
  )
}
