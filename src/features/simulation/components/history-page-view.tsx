"use client"

// Corpo de app/dashboard/history/page.tsx (FE-4, PR 4c — move puro, decisão
// §14 do doc: histórico vive dentro de simulation). Os imports do antigo
// barrel @/features/simulation viram relativos internos — dentro da própria
// feature, feature ↛ feature não se aplica. breadcrumbItems/hrefSimulador/
// aoAbrirRegistro/aoCompararCenarios substituem os literais de rota
// hardcoded — app/ injeta os MESMOS valores de antes (comportamento idêntico).
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-client"
import { useQuery } from "@tanstack/react-query"
import { ArrowRightLeft, FileClock, Loader2, Search } from "lucide-react"
import { getSimulationRecord, listSimulationRecords, queryKeys } from "@/lib/api"
import { formatBRL } from "@/lib/format-money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TransitionSparkline } from "@/components/shared/transition-sparkline"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { useCapability, PlgUpgradeDialog } from "@/features/plg"
import { cn } from "@/lib/utils"
import { ShellBreadcrumb, type ShellBreadcrumbItem } from "@/components/shell/shell-breadcrumb"
import { shellPageClass } from "@/lib/shell-layout"
import { patchDashboardCommandBridge } from "@/lib/dashboard-command-bridge"
import { simulationMachine } from "../machine/machine-store"
import { hydrateSimulationFromRecord } from "../machine/hydrate-record"
import { HistoryRecordPreviewTrigger } from "./history-record-preview-trigger"
import { HistoryRowHoverPreview } from "./history-row-hover-preview"

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

function EconomyScanTag({ delta_impact }: { delta_impact: string }) {
  const n = parseFloat(delta_impact)
  if (!Number.isFinite(n) || n === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Neutro
      </span>
    )
  }
  if (n < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300">
        Economia {formatBRL(String(Math.abs(n)))}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
      +{formatBRL(delta_impact)} carga
    </span>
  )
}

export interface HistoryPageViewProps {
  breadcrumbItems: ShellBreadcrumbItem[]
  hrefSimulador: string
  /** Chamado após hidratar com sucesso um registo aberto — app/ decide a navegação. */
  aoAbrirRegistro: () => void
  /** Chamado após preparar a comparação A/B com sucesso — app/ decide a navegação. */
  aoCompararCenarios: () => void
}

export function HistoryPageView({
  breadcrumbItems,
  hrefSimulador,
  aoAbrirRegistro,
  aoCompararCenarios,
}: HistoryPageViewProps) {
  const { userId, isLoaded, getToken } = useAuth()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [historyFilter, setHistoryFilter] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareUpgradeOpen, setCompareUpgradeOpen] = useState(false)

  const historyPro = useCapability("historyRichPreview")
  const touchMeeting = useTouchMeetingMode()

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.simulationRecords.list(userId, 100),
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return listSimulationRecords(token, userId, 100)
    },
    enabled: isLoaded && !!userId,
  })

  const filteredRecords = useMemo(() => {
    if (!data) return []
    const q = historyFilter.trim().toLowerCase()
    if (!q) return data
    return data.filter((row) => {
      const ctx = (row.company_context ?? "").toLowerCase()
      const y = String(row.year)
      const when = formatDate(row.created_at).toLowerCase()
      return (
        ctx.includes(q) ||
        y.includes(q) ||
        when.includes(q) ||
        row.id.toLowerCase().includes(q)
      )
    })
  }, [data, historyFilter])

  useEffect(() => {
    if (!data || data.length === 0) {
      patchDashboardCommandBridge({ focusHistorySearch: null })
      return
    }
    patchDashboardCommandBridge({
      focusHistorySearch: () => {
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      },
    })
    return () => patchDashboardCommandBridge({ focusHistorySearch: null })
  }, [data])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= 2) {
        return [prev[0], id]
      }
      return [...prev, id]
    })
  }, [])

  async function handleOpenRecord(id: string) {
    if (!userId) return
    setLoadingId(id)
    setLoadError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Não autenticado")
      const d = await getSimulationRecord(token, userId, id)
      hydrateSimulationFromRecord(d)
      aoAbrirRegistro()
    } catch (e) {
      console.error("[TribIA] Erro ao carregar simulação:", e)
      setLoadError("Não foi possível carregar esta simulação. Tente novamente.")
    } finally {
      setLoadingId(null)
    }
  }

  async function handleCompareScenarios() {
    if (!historyPro || selectedIds.length !== 2 || !userId) return
    setCompareLoading(true)
    setLoadError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Não autenticado")
      const [a, b] = await Promise.all([
        getSimulationRecord(token, userId, selectedIds[0]),
        getSimulationRecord(token, userId, selectedIds[1]),
      ])
      simulationMachine.requestHistoryComparison(a, b)
      setSelectedIds([])
      aoCompararCenarios()
    } catch (e) {
      console.error("[TribIA] Erro ao comparar histórico:", e)
      setLoadError("Não foi possível carregar as simulações para comparar.")
    } finally {
      setCompareLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50">
      <div className={shellPageClass()}>

        <ShellBreadcrumb items={breadcrumbItems} />

        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileClock className="h-6 w-6 text-muted-foreground" />
            Histórico de Simulações
          </h1>
          <p className="text-sm text-muted-foreground">
            {historyPro
              ? "Arquivo ativo: sparklines, preview Time-Traveler e comparação de dois cenários."
              : "Lista das suas simulações com pré-visualização suave da trajetória 2026–2033; toque numa linha para abrir no simulador."}
          </p>
          {!historyPro && data && data.length >= 2 && (
            <p className="text-xs text-muted-foreground/90 max-w-xl">
              Seleccione duas simulações para ver como a comparação A/B funciona no TribIA Pro — ideal para reuniões e decisões de cenário.
            </p>
          )}
        </div>

        {!isPending && !isError && data && data.length > 0 && (
          <div className="relative max-w-md">
            <Search
              className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <Input
              ref={searchInputRef}
              type="search"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              placeholder="Filtrar por contexto, ano ou data…"
              className="h-9 pl-9 text-sm"
              aria-label="Filtrar simulações no histórico"
            />
          </div>
        )}

        {historyPro && selectedIds.length === 2 && filteredRecords.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/25 bg-emerald-50/50 px-4 py-3 dark:bg-emerald-950/25 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-emerald-950 dark:text-emerald-100">
              2 simulações selecionadas para comparar
            </p>
            <Button
              type="button"
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 shrink-0"
              disabled={compareLoading}
              onClick={() => void handleCompareScenarios()}
            >
              {compareLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ArrowRightLeft className="h-4 w-4" aria-hidden />
              )}
              Comparar cenários
            </Button>
          </div>
        )}

        {!historyPro && selectedIds.length === 2 && filteredRecords.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground/90">
              <span className="font-medium">Comparação A/B</span>
              {" — "}
              no Pro vê veredito executivo e delta lado a lado, pronto para reuniões e decisão de cenário.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0 border-border/80"
              onClick={() => setCompareUpgradeOpen(true)}
            >
              <ArrowRightLeft className="h-4 w-4" aria-hidden />
              Conhecer no Pro
            </Button>
          </div>
        )}

        <PlgUpgradeDialog
          open={compareUpgradeOpen}
          onOpenChange={setCompareUpgradeOpen}
          feature="compare_ab"
        />

        {loadError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}
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
            <div className="flex flex-col items-center gap-3 py-16 px-4 text-muted-foreground">
              <FileClock className="h-10 w-10 shrink-0 opacity-60" aria-hidden />
              <p className="text-sm font-medium text-foreground/85">
                Passo 3/3: arquivo BI — vereditos e cenários preservados
              </p>
              <p className="text-xs text-center max-w-md leading-relaxed opacity-90">
                No simulador, o fluxo é <span className="font-medium text-foreground/80">Contexto</span> →{" "}
                <span className="font-medium text-foreground/80">Classificação (RAG)</span> →{" "}
                <span className="font-medium text-foreground/80">Veredito</span>. Cada simulação concluída
                aparece aqui para comparação estratégica de longo prazo (horizonte 2026–2033), com trajetórias
                e cenários A/B conforme o seu plano.
              </p>
              <p className="text-xs text-center max-w-xs opacity-80">
                Ainda não há registos — comece pela primeira simulação.
              </p>
              <Link
                href={hrefSimulador}
                className="mt-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
              >
                Ir para o simulador
              </Link>
            </div>
          )}

          {!isPending && data && data.length > 0 && filteredRecords.length === 0 && (
            <p className="text-sm text-muted-foreground px-6 py-6 text-center">
              Nenhuma simulação corresponde a “{historyFilter.trim()}”.
            </p>
          )}

          {!isPending && data && data.length > 0 && filteredRecords.length > 0 && (
            <ul className="divide-y divide-border">
              {filteredRecords.map((row) => {
                const isThisLoading = loadingId === row.id
                const deltaNum = parseFloat(row.delta_impact)
                const deltaNeutral = !Number.isFinite(deltaNum) || deltaNum === 0
                const deltaSaving = deltaNum < 0
                const checked = selectedIds.includes(row.id)

                const openSim = () => void handleOpenRecord(row.id)

                return (
                  <li key={row.id} className="relative flex items-stretch gap-1 px-1 py-1">
                    <label className="flex items-center px-1.5 cursor-pointer shrink-0 tribia-touch-target min-w-[44px] justify-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(row.id)}
                        className="size-4 rounded border-border text-emerald-600 focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={
                          historyPro
                            ? `Incluir simulação de ${formatDate(row.created_at)} na comparação`
                            : `Seleccionar simulação de ${formatDate(row.created_at)} para comparação A/B (disponível no plano Pro)`
                        }
                      />
                    </label>

                    <HistoryRowHoverPreview
                      row={row}
                      historyPro={historyPro}
                      touchMeeting={touchMeeting}
                      isThisLoading={isThisLoading}
                      onOpenInSimulator={openSim}
                    >
                      <button
                        type="button"
                        disabled={isThisLoading}
                        onClick={openSim}
                        className={cn(
                          "min-w-0 flex-1 text-left px-3 sm:px-4 py-3 sm:py-4 hover:bg-muted/50 transition-colors",
                          "flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4",
                          isThisLoading && "opacity-60 cursor-wait",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(row.created_at)}
                          </span>
                          <p className="text-sm font-medium mt-0.5">
                            Ano {row.year}
                            {row.company_context
                              ? ` · ${truncate(row.company_context, historyPro ? 48 : 72)}`
                              : ""}
                          </p>
                        </div>

                        {historyPro && (
                          <div className="flex items-center gap-3 shrink-0">
                            <TransitionSparkline series={row.transition_series} width={80} height={30} />
                            <EconomyScanTag delta_impact={row.delta_impact} />
                          </div>
                        )}

                        {!historyPro && (
                          <div
                            className="flex flex-col items-start gap-0.5 shrink-0 select-none opacity-40 pointer-events-none"
                            aria-label="Pré-visualização da trajetória fiscal (2026–2033) — detalhe completo no plano Pro"
                          >
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Pro
                            </span>
                            <TransitionSparkline series={row.transition_series} width={80} height={30} />
                          </div>
                        )}

                        <div
                          className={cn(
                            "text-xs lg:text-right shrink-0 flex flex-col lg:items-end gap-1",
                            historyPro && "lg:min-w-[9rem]",
                          )}
                        >
                          {isThisLoading ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Carregando…</span>
                            </div>
                          ) : historyPro ? (
                            <div>
                              <span className="text-muted-foreground">Projetado líquido </span>
                              <span className="font-mono font-semibold">
                                {formatBRL(row.total_projected_tax)}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-muted-foreground">Líquido projetado </span>
                              <span className="font-mono font-semibold">
                                {formatBRL(row.total_projected_tax)}
                              </span>
                            </div>
                          )}

                          {historyPro && !isThisLoading && (
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
                          )}
                        </div>
                      </button>
                    </HistoryRowHoverPreview>

                    <HistoryRecordPreviewTrigger
                      row={row}
                      isThisLoading={isThisLoading}
                      onOpenInSimulator={openSim}
                      historyPro={historyPro}
                    />
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
