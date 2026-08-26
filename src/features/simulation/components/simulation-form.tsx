"use client"

import { useEffect, useState } from "react"
import { Building2, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-client"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import { useTribiaPlgTier } from "@/features/plg"
import { listCompanies, queryKeys } from "@/lib/api"
import type { FormExpense, FormService } from "@/types/api"
import { ContextHub } from "./context-hub"
import { RegimeFollowUps } from "./regime-follow-ups"
import { ResultSidebar } from "./result-sidebar"
import { TransactionRow } from "./transaction-row"
import { EmptyStateCard } from "./empty-state-card"
import { TermTooltip } from "./term-tooltip"
import { createBlankExpenseLine, createBlankServiceLine, makeLineId } from "@/lib/simulation-line-helpers"
import { SHORTCUT_KEYS } from "@/constants/shortcuts"

// ─── Props ───────────────────────────────────────────────────────────────────

interface SimulationFormProps {
  onSubmit: (
    year: number,
    services: FormService[],
    expenses: FormExpense[],
    companyContext: string,
  ) => void
  loading: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cardShell =
  "rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-border/60 dark:bg-card/80"

function FormSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-4 lg:col-span-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn(cardShell, "p-5 space-y-3")}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-4">
        <div className={cn(cardShell, "overflow-hidden")}>
          <Skeleton className="h-20 w-full bg-slate-900" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SimulationForm({ onSubmit, loading }: SimulationFormProps) {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- herança FE-0: dívida pré-existente (regra nova do eslint-config-next 16.2.2); resolver ao tocar este arquivo
    setHydrated(true)
  }, [])

  const {
    year,
    companyContext,
    services: storedServices,
    expenses: storedExpenses,
    setServices,
    setExpenses,
    applyCompanyTemplate,
  } = useTaxStore()

  const { userId, getToken } = useAuth()
  const plgTier = useTribiaPlgTier()
  const { data: companies, isPending: companiesLoading } = useQuery({
    queryKey: queryKeys.companies.list(userId, plgTier),
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return listCompanies(token, userId, plgTier)
    },
    enabled: !!userId,
    staleTime: 60_000,
  })

  function handleCompanySelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (!id) return
    const company = companies?.find((c) => c.id === id)
    if (company) applyCompanyTemplate(company)
    e.target.value = ""
  }

  const services = storedServices
  const expenses = storedExpenses

  if (!hydrated) return <FormSkeleton />

  function addService() {
    setServices([...services, createBlankServiceLine()])
  }

  function removeService(id: string) {
    setServices(services.filter((x) => x.id !== id))
  }

  function updateService(id: string, field: keyof FormService, value: string) {
    setServices(services.map((x) => (x.id === id ? { ...x, [field]: value } : x)))
  }

  function addExpense() {
    setExpenses([...expenses, createBlankExpenseLine()])
  }

  function removeExpense(id: string) {
    setExpenses(expenses.filter((x) => x.id !== id))
  }

  function updateExpense(id: string, field: keyof FormExpense, value: string) {
    setExpenses(expenses.map((x) => (x.id === id ? { ...x, [field]: value } : x)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validServices = services.filter((s) => s.description && s.amount)
    const validExpenses = expenses.filter((ex) => ex.description && ex.amount)
    if (validServices.length === 0) return
    onSubmit(year, validServices, validExpenses, companyContext)
  }

  const totalReceita = services.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0)
  const totalDespesas = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0)
  const validServices = services.filter((s) => s.description && s.amount)
  const validExpenses = expenses.filter((e) => e.description && e.amount)

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-4 lg:col-span-8">
          {userId && (
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border border-dashed border-slate-200/80 bg-muted/30 px-4 py-2.5 backdrop-blur-sm dark:border-border/60",
              )}
            >
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                  Empresa:
                </span>
                {companiesLoading ? (
                  <Skeleton className="h-7 w-48" />
                ) : (
                  <select
                    onChange={handleCompanySelect}
                    defaultValue=""
                    className={cn(
                      "h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs text-foreground",
                      "focus:outline-none focus:ring-1 focus:ring-ring",
                      "disabled:opacity-50",
                    )}
                  >
                    <option value="" disabled>
                      {companies && companies.length > 0
                        ? "Selecionar empresa pré-cadastrada…"
                        : "Nenhuma empresa cadastrada — preencha manualmente"}
                    </option>
                    {(companies ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <ContextHub />
          <RegimeFollowUps />

          <Card className={cn(cardShell, "ring-0")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-500" />
                    <span className="font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Serviços / Receitas
                    </span>
                  </span>
                  {validServices.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-xs font-normal">
                      {validServices.length}
                    </Badge>
                  )}
                </CardTitle>
                {services.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={addService} className="h-7 gap-1 text-xs">
                    <Plus className="size-3" />
                    Adicionar
                    <Kbd className="ml-0.5 opacity-90">{SHORTCUT_KEYS.addService}</Kbd>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <EmptyStateCard type="service" onAdd={addService} />
              ) : (
                <>
                  <div className="space-y-3">
                    {services.map((svc) => (
                      <TransactionRow
                        key={svc.id}
                        variant="service"
                        id={svc.id}
                        description={svc.description ?? ""}
                        amount={svc.amount ?? ""}
                        issRate={svc.iss_rate ?? ""}
                        onDescriptionChange={(v) => updateService(svc.id, "description", v)}
                        onAmountChange={(v) => updateService(svc.id, "amount", v)}
                        onIssRateChange={(v) => updateService(svc.id, "iss_rate", v)}
                        onRemove={() => removeService(svc.id)}
                        removeDisabled={services.length === 1}
                      />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={cn(cardShell, "ring-0")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span className="font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Análise de despesas
                    </span>
                    <span className="text-xs font-normal normal-case tracking-normal text-emerald-600/80 dark:text-emerald-400/80">
                      (RAG ativo)
                    </span>
                  </span>
                  {validExpenses.length > 0 && (
                    <Badge variant="secondary" className="h-4 w-fit px-1.5 text-xs font-normal">
                      {validExpenses.length}
                    </Badge>
                  )}
                </CardTitle>
                {expenses.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={addExpense} className="h-7 gap-1 text-xs">
                    <Plus className="size-3" />
                    Adicionar
                    <Kbd className="ml-0.5 opacity-90">{SHORTCUT_KEYS.addExpense}</Kbd>
                  </Button>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                A IA classifica automaticamente a elegibilidade de cada despesa para crédito de{" "}
                <TermTooltip term="IBS">—</TermTooltip>/<TermTooltip term="CBS">—</TermTooltip>.
              </p>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <EmptyStateCard type="expense" onAdd={addExpense} />
              ) : (
                <>
                  <div className="space-y-3">
                    {expenses.map((exp) => (
                      <TransactionRow
                        key={exp.id}
                        variant="expense"
                        id={exp.id}
                        description={exp.description ?? ""}
                        amount={exp.amount ?? ""}
                        fiscalStatus="neutral"
                        onDescriptionChange={(v) => updateExpense(exp.id, "description", v)}
                        onAmountChange={(v) => updateExpense(exp.id, "amount", v)}
                        onRemove={() => removeExpense(exp.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="overflow-visible lg:col-span-4">
          <ResultSidebar
            year={year}
            totalReceita={totalReceita}
            totalDespesas={totalDespesas}
            validServicesCount={validServices.length}
            validExpensesCount={validExpenses.length}
            loading={loading}
            canSubmit={validServices.length > 0}
            educationalMode={validServices.length === 0}
          />
        </div>
      </div>
    </form>
  )
}
