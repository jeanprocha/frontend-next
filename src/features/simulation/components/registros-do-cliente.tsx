"use client"

// Lista de dossiês de UM cliente (FE-4) — dentro do workspace
// /clientes/[companyId]. Diferente de HistoryPageView (histórico GLOBAL,
// todos os clientes + legados): usa o filtro ?company_id= (backend FE-4 PR
// 4a). Sem busca/comparação A/B nesta primeira versão — registrado como
// limitação (W9 pleno pode trazer isso para cá).
import { useAuth } from "@/lib/auth-client"
import { useQuery } from "@tanstack/react-query"
import { FileClock, Loader2 } from "lucide-react"
import { listSimulationRecords, queryKeys } from "@/lib/api"
import { formatBRL } from "@/lib/format-money"
import { cn } from "@/lib/utils"

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

export interface RegistrosDoClienteProps {
  companyId: string
  aoAbrirRegistro: (recordId: string) => void
}

export function RegistrosDoCliente({ companyId, aoAbrirRegistro }: RegistrosDoClienteProps) {
  const { userId, isLoaded, getToken } = useAuth()

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.simulationRecords.list(userId, 100, companyId),
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return listSimulationRecords(token, userId, 100, companyId)
    },
    enabled: isLoaded && !!userId && !!companyId,
  })

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <FileClock className="h-4 w-4 text-muted-foreground" />
          Simulações deste cliente
        </h2>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando…
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive px-4 py-6">
          Não foi possível carregar as simulações deste cliente.
        </p>
      )}

      {!isPending && !isError && (!data || data.length === 0) && (
        <p className="text-sm text-muted-foreground px-4 py-8 text-center">
          Ainda não há simulações salvas para este cliente — rode uma acima.
        </p>
      )}

      {!isPending && data && data.length > 0 && (
        <ul className="divide-y divide-border">
          {data.map((row) => {
            const deltaNum = parseFloat(row.delta_impact)
            const deltaNeutral = !Number.isFinite(deltaNum) || deltaNum === 0
            const deltaSaving = !deltaNeutral && deltaNum < 0
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => aoAbrirRegistro(row.id)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
                    <p className="text-sm font-medium mt-0.5">Ano {row.year}</p>
                  </div>
                  <div className="text-xs text-right shrink-0">
                    <span className="text-muted-foreground">Líquido projetado </span>
                    <span className="font-mono font-semibold">{formatBRL(row.total_projected_tax)}</span>
                    <div
                      className={cn(
                        "mt-0.5 font-mono",
                        deltaNeutral
                          ? "text-muted-foreground"
                          : deltaSaving
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-red-700 dark:text-red-400",
                      )}
                    >
                      {deltaNeutral ? "→ " : deltaSaving ? "↓ " : "↑ "}
                      {formatBRL(row.delta_impact)}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
