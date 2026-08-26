"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-client"
import { useTribiaPlgTier } from "@/hooks/use-tribia-plg-tier"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  Download,
  GitCompare,
  LayoutDashboard,
  Library,
  Plus,
  Presentation,
  ScanLine,
  Search,
  SunMoon,
  Zap,
} from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import {
  commandPaletteGlobalHints,
  comparisonAbShortcutLabel,
  confirmAiDiagnosticShiftEnterLabel,
  LEADER_G_MS,
  modKeyLabel,
  NAV_LINK_LABELS,
  PALETTE_GO_SIMULATOR_LABEL,
  SHORTCUT_KEYS,
  simulateShortcutLabel,
} from "@/constants/shortcuts"
import { listCompanies, queryKeys } from "@/lib/api"
import { getDashboardCommandBridge } from "@/lib/dashboard-command-bridge"
import { isApplePlatform } from "@/lib/platform"
import { toggleColorTheme } from "@/lib/theme-preference"
import { createBlankExpenseLine, createBlankServiceLine } from "@/lib/simulation-line-helpers"
import { useTaxStore } from "@/store/useTaxStore"

/** Evita roubar teclas com foco em campo de formulário (plano-mãe §2.1). */
function isEditableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false
  if (el.closest("[data-command-palette-ignore-hotkeys]")) return true
  const tag = el.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  if (el.isContentEditable) return true
  if (el.closest('[contenteditable="true"]')) return true
  return Boolean(el.closest("[cmdk-input-wrapper]"))
}

function isDialogOpen(): boolean {
  return Boolean(document.querySelector('[role="dialog"][data-state="open"]'))
}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [leaderGArmed, setLeaderGArmed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { userId, getToken } = useAuth()
  const plgTier = useTribiaPlgTier()
  const mod = modKeyLabel()
  const leaderGRef = useRef<{
    armed: boolean
    timer: ReturnType<typeof setTimeout> | null
  }>({ armed: false, timer: null })

  const { data: companies } = useQuery({
    queryKey: queryKeys.companies.list(userId, plgTier),
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return listCompanies(token, userId, plgTier)
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  })

  const close = useCallback(() => setOpen(false), [])

  const addService = useCallback(() => {
    const { services, setServices } = useTaxStore.getState()
    setServices([...services, createBlankServiceLine()])
    close()
  }, [close])

  const addExpense = useCallback(() => {
    const { expenses, setExpenses } = useTaxStore.getState()
    setExpenses([...expenses, createBlankExpenseLine()])
    close()
  }, [close])

  const runSimulation = useCallback(() => {
    getDashboardCommandBridge().runSimulation?.()
    close()
  }, [close])

  const toggleBoard = useCallback(() => {
    getDashboardCommandBridge().toggleBoardReady?.()
    close()
  }, [close])

  const runPrint = useCallback(() => {
    window.print()
    close()
  }, [close])

  const go = useCallback(
    (path: string) => {
      router.push(path)
      close()
    },
    [router, close],
  )

  const applyCompany = useCallback(
    (id: string) => {
      const company = companies?.find((c) => c.id === id)
      if (!company) return
      useTaxStore.getState().applyCompanyTemplate(company)
      if (pathname !== "/dashboard") {
        router.push("/dashboard")
      }
      close()
    },
    [companies, pathname, router, close],
  )

  const focusHistorySearch = useCallback(() => {
    getDashboardCommandBridge().focusHistorySearch?.()
    close()
  }, [close])

  const openNewCompanyForm = useCallback(() => {
    getDashboardCommandBridge().openCompaniesNewForm?.()
    close()
  }, [close])

  const toggleComparisonAB = useCallback(() => {
    getDashboardCommandBridge().toggleComparisonAB?.()
    close()
  }, [close])

  const confirmAiDiagnostic = useCallback(() => {
    getDashboardCommandBridge().confirmAiDiagnostic?.()
    close()
  }, [close])

  const toggleTheme = useCallback(() => {
    toggleColorTheme()
    close()
  }, [close])

  const onDashboard =
    pathname === "/dashboard" || pathname === "/dashboard/"
  const onHistory = pathname.startsWith("/dashboard/history")
  const onCompanies = pathname.startsWith("/dashboard/companies")

  const disarmLeaderG = useCallback(() => {
    const r = leaderGRef.current
    r.armed = false
    if (r.timer) {
      clearTimeout(r.timer)
      r.timer = null
    }
    setLeaderGArmed(false)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const modK = e.key === "k" && (e.metaKey || e.ctrlKey)

      if (open) {
        if (modK) {
          e.preventDefault()
          disarmLeaderG()
          setOpen((v) => !v)
        } else {
          disarmLeaderG()
        }
        return
      }

      if (isDialogOpen()) {
        disarmLeaderG()
        return
      }

      if (isEditableTarget(e.target)) {
        disarmLeaderG()
        return
      }

      if (modK) {
        e.preventDefault()
        disarmLeaderG()
        setOpen((v) => !v)
        return
      }

      const r = leaderGRef.current
      if (r.armed) {
        if (
          (e.key === "h" || e.key === "H") &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault()
          disarmLeaderG()
          router.push("/dashboard/history")
          return
        }
        disarmLeaderG()
      }

      if (
        (e.key === "g" || e.key === "G") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault()
        disarmLeaderG()
        r.armed = true
        setLeaderGArmed(true)
        r.timer = setTimeout(() => {
          disarmLeaderG()
        }, LEADER_G_MS)
        return
      }

      const b = getDashboardCommandBridge()
      const apple = isApplePlatform()
      const modDown = apple ? e.metaKey : e.ctrlKey
      const isProOrPremium = plgTier === "pro" || plgTier === "premium"
      const proFormResults =
        isProOrPremium &&
        onDashboard &&
        b.hasFormResults &&
        !b.isSimulationInputPhase &&
        !b.isLoadingSimulation

      if (e.key === "Enter" && modDown) {
        if (e.shiftKey) {
          if (proFormResults && b.confirmAiDiagnostic) {
            e.preventDefault()
            b.confirmAiDiagnostic()
          }
          return
        }
        e.preventDefault()
        b.runSimulation?.()
        return
      }

      if (proFormResults) {
        if ((e.key === "b" || e.key === "B") && modDown && e.shiftKey) {
          if (b.toggleComparisonAB) {
            e.preventDefault()
            b.toggleComparisonAB()
          }
          return
        }
        if (
          b.confirmAiDiagnostic &&
          (e.key === "a" || e.key === "A") &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          !e.shiftKey
        ) {
          e.preventDefault()
          b.confirmAiDiagnostic()
          return
        }
      }

      const simInput =
        onDashboard && b.isSimulationInputPhase && !b.isLoadingSimulation
      if (simInput) {
        if (e.key === "a" || e.key === "A") {
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault()
            addService()
          }
          return
        }
        if (e.key === "d" || e.key === "D") {
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault()
            addExpense()
          }
          return
        }
      }

      if (
        (e.key === "b" || e.key === "B") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (b.toggleBoardReady) {
          e.preventDefault()
          b.toggleBoardReady()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [
    open,
    onDashboard,
    plgTier,
    addService,
    addExpense,
    router,
    disarmLeaderG,
  ])

  const b = getDashboardCommandBridge()
  const canSimActions =
    onDashboard && b.isSimulationInputPhase && !b.isLoadingSimulation
  const canRun = Boolean(b.runSimulation)
  const canBoard = Boolean(b.toggleBoardReady)
  const canPrint = b.hasFormResults && !b.isLoadingSimulation
  const canFocusHistorySearch = Boolean(b.focusHistorySearch)
  const canOpenCompanyForm = Boolean(b.openCompaniesNewForm)

  const isProOrPremium = plgTier === "pro" || plgTier === "premium"
  const proFormResultHotkeys =
    isProOrPremium &&
    onDashboard &&
    b.hasFormResults &&
    !b.isSimulationInputPhase &&
    !b.isLoadingSimulation
  const canToggleComparison = Boolean(b.toggleComparisonAB) && proFormResultHotkeys
  const canConfirmAi = Boolean(b.confirmAiDiagnostic) && proFormResultHotkeys
  const showScenarioGroup = canToggleComparison || canConfirmAi

  const showQuickActions =
    canSimActions ||
    (onHistory && canFocusHistorySearch) ||
    (onCompanies && canOpenCompanyForm)

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {leaderGArmed
          ? `Atalho activo: prima ${SHORTCUT_KEYS.followHistory} para abrir o histórico.`
          : ""}
      </p>
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Comandos TribIA"
      description="Pesquise uma ação ou navegue com o teclado."
    >
      <Command className="rounded-lg border-0 shadow-none" shouldFilter>
        <CommandInput placeholder="Comando ou pesquisa…" />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          {showQuickActions && (
            <CommandGroup heading="Ações rápidas (esta página)">
              {onHistory && canFocusHistorySearch && (
                <CommandItem
                  value="histórico pesquisar filtrar simulações"
                  onSelect={focusHistorySearch}
                >
                  <Search className="size-4 text-muted-foreground" />
                  <span>Focar pesquisa no histórico</span>
                </CommandItem>
              )}
              {onCompanies && canOpenCompanyForm && (
                <CommandItem
                  value="empresa nova cadastro"
                  onSelect={openNewCompanyForm}
                >
                  <Plus className="size-4 text-emerald-600" />
                  <span>Nova empresa</span>
                </CommandItem>
              )}
              {canSimActions && (
                <>
                  <CommandItem
                    value="adicionar serviço receita linha"
                    onSelect={addService}
                  >
                    <Plus className="size-4" />
                    <span>Adicionar serviço / receita</span>
                    <CommandShortcut>{SHORTCUT_KEYS.addService}</CommandShortcut>
                  </CommandItem>
                  <CommandItem
                    value="adicionar despesa linha"
                    onSelect={addExpense}
                  >
                    <Plus className="size-4" />
                    <span>Adicionar despesa</span>
                    <CommandShortcut>{SHORTCUT_KEYS.addExpense}</CommandShortcut>
                  </CommandItem>
                  <CommandItem
                    value="executar simulação ia motor"
                    onSelect={runSimulation}
                    disabled={!canRun}
                  >
                    <Zap className="size-4 text-emerald-600" />
                    <span>Executar simulação (IA + motor)</span>
                    <CommandShortcut>{simulateShortcutLabel()}</CommandShortcut>
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          )}

          {showQuickActions && <CommandSeparator />}

          {showScenarioGroup && (
            <>
              <CommandGroup heading="Cenário e Operação">
                {canToggleComparison && (
                  <CommandItem
                    value="comparação a b ativar desativar cenário"
                    onSelect={toggleComparisonAB}
                  >
                    <GitCompare className="size-4 text-emerald-600" />
                    <span>
                      {b.isComparingAB
                        ? "Sair do modo comparação A/B"
                        : "Comparação A/B (congelar cenário A)"}
                    </span>
                    <CommandShortcut>
                      {comparisonAbShortcutLabel()}
                    </CommandShortcut>
                  </CommandItem>
                )}
                {canConfirmAi && (
                  <CommandItem
                    value="validar diagnóstico ia mesa sugestões originais"
                    onSelect={confirmAiDiagnostic}
                  >
                    <ScanLine className="size-4 text-emerald-600" />
                    <span>Validar diagnóstico da IA (restaurar sugestões)</span>
                    <CommandShortcut>
                      {`${confirmAiDiagnosticShiftEnterLabel()} · A`}
                    </CommandShortcut>
                  </CommandItem>
                )}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Navegação">
            <CommandItem
              value={`ir simulador dashboard ${NAV_LINK_LABELS.simulator}`}
              onSelect={() => go("/dashboard")}
            >
              <LayoutDashboard className="size-4 text-muted-foreground" />
              <span>{PALETTE_GO_SIMULATOR_LABEL}</span>
            </CommandItem>
            <CommandItem
              value={`empresas cadastro ${NAV_LINK_LABELS.companies}`}
              onSelect={() => go("/dashboard/companies")}
            >
              <Building2 className="size-4 text-muted-foreground" />
              <span>{NAV_LINK_LABELS.companies}</span>
            </CommandItem>
            <CommandItem
              value={`histórico simulações ${NAV_LINK_LABELS.history}`}
              onSelect={() => go("/dashboard/history")}
            >
              <Library className="size-4 text-muted-foreground" />
              <span>{NAV_LINK_LABELS.history}</span>
            </CommandItem>
          </CommandGroup>

          {userId && companies && companies.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Aplicar empresa">
                {companies.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`empresa ${c.name} ${c.tax_context ?? ""}`}
                    onSelect={() => applyCompany(c.id)}
                  >
                    <Building2 className="size-4 text-emerald-600" />
                    <span>{c.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Preferências">
            {canBoard && (
              <CommandItem value="modo apresentação board" onSelect={toggleBoard}>
                <Presentation className="size-4" />
                <span>Modo apresentação</span>
                <CommandShortcut>{SHORTCUT_KEYS.board}</CommandShortcut>
              </CommandItem>
            )}
            <CommandItem value="alternar tema claro escuro" onSelect={toggleTheme}>
              <SunMoon className="size-4 text-muted-foreground" />
              <span>Alternar tema (claro / escuro)</span>
            </CommandItem>
          </CommandGroup>

          {canPrint && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Documento">
                <CommandItem value="imprimir relatório pdf" onSelect={runPrint}>
                  <Download className="size-4" />
                  <span>Imprimir / PDF (navegador)</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>navegar</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Enter</Kbd>
            <span>selecionar</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Esc</Kbd>
            <span>fechar</span>
          </span>
          <span className="inline-flex items-center gap-1 opacity-90">
            <Kbd>{mod}</Kbd>
            <Kbd>{SHORTCUT_KEYS.paletteOpen}</Kbd>
            <span>comandos</span>
          </span>
          <span className="text-muted-foreground/80">
            {commandPaletteGlobalHints(canBoard, {
              proFormResultHotkeys: proFormResultHotkeys,
            })}
          </span>
        </div>
      </Command>
    </CommandDialog>
    </>
  )
}
