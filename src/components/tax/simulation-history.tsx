"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { FileClock, FileDown, Loader2 } from "lucide-react"
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

interface SimulationHistoryProps {
  /** Limpa estado local efêmero (ex.: CSV) antes de reidratar do histórico. */
  onBeforeHydrate?: () => void
}

export function SimulationHistory({ onBeforeHydrate }: SimulationHistoryProps) {
  const { userId, isLoaded, getToken } = useAuth()
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null)
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
      return listSimulationRecords(token, userId, 25)
    },
    enabled: isLoaded && !!userId,
  })

  async function handleOpenRecord(id: string) {
    if (!userId) return
    onBeforeHydrate?.()
    try {
      const token = await getToken()
      if (!token) return
      const d = await getSimulationRecord(token, userId, id)
      setYear(d.year)
      setCompanyContext(d.company_context)
      setServices(d.services)
      setExpenses(d.expenses)
      const classifications: ClassificationItem[] = d.classifications.map(
        (c) => ({
          ...c,
          evidence: c.evidence ?? [],
        }),
      )
      const expenses: FormExpense[] = d.expenses.map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
      }))
      const ai_metadata = aggregateRagMetadata([], classifications)
      setFormResults({
        mode: "form",
        simulation: d.simulation,
        classifications,
        expenses,
        ai_metadata: ai_metadata ?? null,
      })
    } catch (e) {
      console.error("[TribIA] Erro ao reidratar simulação:", e)
    }
  }

  async function handleDownloadPDF(id: string) {
    setPdfError(null)
    setPdfLoadingId(id)
    try {
      const token = await getToken()
      if (!token || !userId) {
        setPdfError("Sessão expirada. Entre novamente.")
        return
      }
      await downloadSimulationReport(token, userId, id)
    } catch (e) {
      setPdfError((e as Error).message)
    } finally {
      setPdfLoadingId(null)
    }
  }

  if (!isLoaded || !userId) return null

  return (
    <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b bg-muted/30">
        <h2 className="text-sm font-semibold">Histórico de simulações</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Simulações salvas no servidor. Clique para reabrir o cenário no painel abaixo.
        </p>
      </div>
      <div className="p-4">
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando histórico…
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive">
            {(error as Error).message}
          </p>
        )}
        {!isPending && !isError && (!data || data.length === 0) && (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground opacity-60">
            <FileClock className="h-8 w-8" aria-hidden />
            <p className="text-sm">Nenhuma simulação salva ainda.</p>
            <p className="text-xs text-center max-w-sm">
              Rode uma simulação para criar o primeiro registro.
            </p>
          </div>
        )}
        {!isPending && data && data.length > 0 && (
          <div className="space-y-2">
            {pdfError && (
              <p className="text-xs text-destructive px-1" role="alert">
                {pdfError}
              </p>
            )}
            <ul className="divide-y divide-border max-h-56 overflow-y-auto">
              {data.map((row) => {
                const deltaNum = parseFloat(row.delta_impact)
                const deltaNeutral = !Number.isFinite(deltaNum) || deltaNum === 0
                const deltaSaving = deltaNum < 0
                return (
                  <li key={row.id} className="flex items-stretch gap-1 py-1 first:pt-0">
                    <button
                      type="button"
                      onClick={() => void handleOpenRecord(row.id)}
                      className="min-w-0 flex-1 text-left px-3 py-3 rounded-lg hover:bg-muted/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                    >
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(row.created_at)}
                        </span>
                        <p className="text-sm font-medium mt-0.5">
                          Ano {row.year}
                          {row.company_context
                            ? ` · ${truncate(row.company_context, 48)}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-xs sm:text-right shrink-0 flex flex-col sm:items-end gap-1">
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
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-auto min-h-12 w-10 shrink-0 self-stretch sm:self-center"
                      title="Baixar diagnóstico (PDF)"
                      aria-label="Baixar diagnóstico em PDF"
                      disabled={pdfLoadingId === row.id}
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
          </div>
        )}
      </div>
    </section>
  )
}
