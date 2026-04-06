"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  Download,
  LayoutDashboard,
  Library,
  Plus,
  Presentation,
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
import { listCompanies } from "@/lib/api"
import { getDashboardCommandBridge } from "@/lib/dashboard-command-bridge"
import { isApplePlatform, modKeyLabel } from "@/lib/platform"
import { createBlankExpenseLine, createBlankServiceLine } from "@/lib/simulation-line-helpers"
import { useTaxStore } from "@/store/useTaxStore"

function isEditableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  if (el.isContentEditable) return true
  if (el.closest("[data-command-palette-ignore-hotkeys]")) return true
  return Boolean(el.closest("[cmdk-input-wrapper]"))
}

function isDialogOpen(): boolean {
  return Boolean(document.querySelector('[role="dialog"][data-state="open"]'))
}

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { userId, getToken } = useAuth()
  const mod = modKeyLabel()

  const { data: companies } = useQuery({
    queryKey: ["companies", userId],
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return listCompanies(token, userId)
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

  const onDashboard = pathname === "/dashboard"

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
      if (open) return
      if (isDialogOpen()) return
      if (isEditableTarget(e.target)) return

      const b = getDashboardCommandBridge()
      const apple = isApplePlatform()
      const modDown = apple ? e.metaKey : e.ctrlKey

      if (e.key === "Enter" && modDown) {
        e.preventDefault()
        b.runSimulation?.()
        return
      }

      const simInput = onDashboard && b.isSimulationInputPhase && !b.isLoadingSimulation
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

      if ((e.key === "b" || e.key === "B") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (b.toggleBoardReady) {
          e.preventDefault()
          b.toggleBoardReady()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onDashboard, addService, addExpense])

  const b = getDashboardCommandBridge()
  const canSimActions = onDashboard && b.isSimulationInputPhase && !b.isLoadingSimulation
  const canRun = Boolean(b.runSimulation)
  const canBoard = Boolean(b.toggleBoardReady)
  const canPrint = b.hasFormResults && !b.isLoadingSimulation

  return (
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

          <CommandGroup heading="Navegação">
            <CommandItem value="dashboard simulador" onSelect={() => go("/dashboard")}>
              <LayoutDashboard className="size-4 text-muted-foreground" />
              <span>Ir ao simulador</span>
            </CommandItem>
            <CommandItem value="histórico simulações" onSelect={() => go("/dashboard/history")}>
              <Library className="size-4 text-muted-foreground" />
              <span>Histórico de simulações</span>
            </CommandItem>
            <CommandItem value="empresas cadastro" onSelect={() => go("/dashboard/companies")}>
              <Building2 className="size-4 text-muted-foreground" />
              <span>Empresas cadastradas</span>
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

          {canSimActions && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Simulação (formulário)">
                <CommandItem value="executar simulação ia" onSelect={runSimulation} disabled={!canRun}>
                  <Zap className="size-4 text-emerald-600" />
                  <span>Executar simulação (IA + motor)</span>
                  <CommandShortcut>{mod}+Enter</CommandShortcut>
                </CommandItem>
                <CommandItem value="adicionar serviço receita" onSelect={addService}>
                  <Plus className="size-4" />
                  <span>Adicionar serviço / receita</span>
                  <CommandShortcut>A</CommandShortcut>
                </CommandItem>
                <CommandItem value="adicionar despesa" onSelect={addExpense}>
                  <Plus className="size-4" />
                  <span>Adicionar despesa</span>
                  <CommandShortcut>D</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {(canBoard || canPrint) && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Resultados">
                {canBoard && (
                  <CommandItem value="modo apresentação board" onSelect={toggleBoard}>
                    <Presentation className="size-4" />
                    <span>Modo apresentação</span>
                    <CommandShortcut>B</CommandShortcut>
                  </CommandItem>
                )}
                {canPrint && (
                  <CommandItem value="imprimir relatório pdf" onSelect={runPrint}>
                    <Download className="size-4" />
                    <span>Imprimir / PDF (navegador)</span>
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}
        </CommandList>
        <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          Dica: {mod}+K abre este menu · {mod}+Enter simula · A / D linhas · B apresentação (com resultado)
        </p>
      </Command>
    </CommandDialog>
  )
}
