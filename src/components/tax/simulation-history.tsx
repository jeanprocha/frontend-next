"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { formatBRL, getSimulationRecord, listSimulationRecords } from "@/lib/api"
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
  const { userId, isLoaded } = useAuth()
  const {
    setYear,
    setCompanyContext,
    setServices,
    setExpenses,
    setResults: setFormResults,
  } = useTaxStore()

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["simulation-records", userId],
    queryFn: () => listSimulationRecords(userId!, 25),
    enabled: isLoaded && !!userId,
  })

  async function handleOpenRecord(id: string) {
    if (!userId) return
    onBeforeHydrate?.()
    try {
      const d = await getSimulationRecord(userId, id)
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
      setFormResults({
        mode: "form",
        simulation: d.simulation,
        classifications,
        expenses,
      })
    } catch (e) {
      console.error("[TribIA] Erro ao reidratar simulação:", e)
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
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma simulação salva ainda. Rode uma simulação para criar o primeiro registro.
          </p>
        )}
        {!isPending && data && data.length > 0 && (
          <ul className="divide-y divide-border max-h-56 overflow-y-auto">
            {data.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => void handleOpenRecord(row.id)}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
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
                  <div className="text-xs sm:text-right shrink-0">
                    <span className="text-muted-foreground">Projetado líquido </span>
                    <span className="font-mono font-semibold">
                      {formatBRL(row.total_projected_tax)}
                    </span>
                    <span className="text-muted-foreground mx-1">·</span>
                    <span className="text-muted-foreground">Δ </span>
                    <span className="font-mono">{formatBRL(row.delta_impact)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
