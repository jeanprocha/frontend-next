"use client"

import { useEffect, useState } from "react"
import { Settings2, Receipt, TrendingDown, Info, Plus, X, Sparkles, Building2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useTaxStore } from "@/store/useTaxStore"
import { listCompanies } from "@/lib/api"
import type { FormExpense, FormService } from "@/types/api"

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

function makeId() {
  return Math.random().toString(36).slice(2)
}

// Defaults usados apenas quando o store está vazio (primeira visita, sem localStorage).
const DEFAULT_SERVICES: FormService[] = [
  { id: makeId(), description: "Consultoria de Software", amount: "10000.00", iss_rate: "0.05" },
]

const DEFAULT_EXPENSES: FormExpense[] = [
  { id: makeId(), description: "AWS", amount: "3000.00" },
  { id: makeId(), description: "GitHub Copilot", amount: "500.00" },
]

// ─── Tooltip para termos jurídicos ───────────────────────────────────────────

function TermTooltip({ term, children }: { term: string; children: React.ReactNode }) {
  const glossary: Record<string, string> = {
    IBS: "Imposto sobre Bens e Serviços — tributo estadual/municipal criado pela reforma tributária (LC 68/2024) que substituirá ICMS e ISS.",
    CBS: "Contribuição sobre Bens e Serviços — tributo federal que substituirá PIS e COFINS a partir de 2026.",
    "Split Payment": "Mecanismo automático de pagamento fracionado: o tributo é retido diretamente na transação financeira, sem passar pelo caixa do fornecedor.",
  }
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help border-b border-dashed border-muted-foreground/50 text-inherit">
        {term}
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-relaxed">
        {glossary[term] ?? children}
      </TooltipContent>
    </Tooltip>
  )
}

// ─── Skeleton exibido enquanto o localStorage hidrata ────────────────────────

function FormSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-white/80 p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-1">
        <div className="rounded-xl border bg-white/80 overflow-hidden">
          <Skeleton className="h-16 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function SimulationForm({ onSubmit, loading }: SimulationFormProps) {
  // ── Guard anti-hydration (Next.js SSR + localStorage) ──────────────────
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])

  // ── Estado global (Zustand) ─────────────────────────────────────────────
  const {
    year,
    companyContext,
    services: storedServices,
    expenses: storedExpenses,
    setYear,
    setCompanyContext,
    setServices,
    setExpenses,
    applyCompanyTemplate,
  } = useTaxStore()

  // ── Seletor de empresa pré-cadastrada ───────────────────────────────────
  const { userId } = useAuth()
  const { data: companies, isPending: companiesLoading } = useQuery({
    queryKey: ["companies", userId],
    queryFn: () => listCompanies(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  })

  function handleCompanySelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    if (!id) return
    const company = companies?.find((c) => c.id === id)
    if (company) applyCompanyTemplate(company)
    // Reseta o select para o estado "neutro" após aplicar
    e.target.value = ""
  }

  // Quando o store está vazio (primeira visita), semeamos os defaults.
  // Isso acontece UMA vez, após a hidratação, sem forçar um re-render extra.
  useEffect(() => {
    if (!hydrated) return
    if (storedServices.length === 0) setServices(DEFAULT_SERVICES)
    if (storedExpenses.length === 0) setExpenses(DEFAULT_EXPENSES)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  // Aliases locais para leitura mais limpa no JSX
  const services = storedServices
  const expenses = storedExpenses

  if (!hydrated) return <FormSkeleton />

  // ── Handlers (lógica intacta; agora escrevem no store) ──────────────────

  function addService() {
    setServices([...services, { id: makeId(), description: "", amount: "", iss_rate: "0.05" }])
  }

  function removeService(id: string) {
    setServices(services.filter((x) => x.id !== id))
  }

  function updateService(id: string, field: keyof FormService, value: string) {
    setServices(services.map((x) => (x.id === id ? { ...x, [field]: value } : x)))
  }

  function addExpense() {
    setExpenses([...expenses, { id: makeId(), description: "", amount: "" }])
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

  // ── Computed para o card de preview ────────────────────────────────────
  const totalReceita = services.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0)
  const totalDespesas = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0)
  const validServices = services.filter((s) => s.description && s.amount)
  const validExpenses = expenses.filter((e) => e.description && e.amount)

  // ── JSX ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Coluna 1 e 2 — Inputs ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Seletor de empresa pré-cadastrada ──────────────────────────── */}
          {userId && (
            <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-muted bg-muted/30 px-4 py-2.5">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Empresa:
                </span>
                {companiesLoading ? (
                  <Skeleton className="h-7 w-48" />
                ) : (
                  <select
                    onChange={handleCompanySelect}
                    defaultValue=""
                    className={cn(
                      "flex-1 min-w-0 h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground",
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

          {/* Card: Configuração ─────────────────────────────────────────── */}
          <Card className="rounded-xl border-muted/50 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Settings2 className="size-4 text-muted-foreground" />
                Configuração da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ano de transição
                </Label>
                <Input
                  id="year"
                  type="number"
                  min={2026}
                  max={2033}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-9"
                />
                <p className="text-[11px] text-muted-foreground">
                  2026–2033 conforme cronograma da reforma
                </p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="context" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Contexto da empresa
                  <span className="ml-1 text-accent">(usado pela IA para classificar créditos)</span>
                </Label>
                <Input
                  id="context"
                  placeholder="ex: empresa SaaS, regime regular IBS/CBS..."
                  value={companyContext ?? ""}
                  onChange={(e) => setCompanyContext(e.target.value)}
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Serviços / Receitas ──────────────────────────────────── */}
          <Card className="rounded-xl border-muted/50 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Receipt className="size-4 text-muted-foreground" />
                  Serviços / Receitas
                  {validServices.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                      {validServices.length}
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addService}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="size-3" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                  <Receipt className="size-8 opacity-30" />
                  <p className="text-sm">Nenhum serviço adicionado</p>
                  <p className="text-xs opacity-70">Adicione ao menos um serviço para simular</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_112px_88px_32px] gap-2 mb-2 px-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Descrição</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Valor (R$)</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Alíq. ISS</span>
                    <span />
                  </div>
                  <div className="space-y-1.5">
                    {services.map((svc) => (
                      <div key={svc.id} className="grid grid-cols-[1fr_112px_88px_32px] gap-2 items-center group">
                        <Input
                          placeholder="Consultoria, Licença SaaS..."
                          value={svc.description ?? ""}
                          onChange={(e) => updateService(svc.id, "description", e.target.value)}
                          required
                          className="h-8 text-sm"
                        />
                        <Input
                          placeholder="10000.00"
                          value={svc.amount ?? ""}
                          onChange={(e) => updateService(svc.id, "amount", e.target.value)}
                          required
                          className="h-8 text-sm tabular-nums"
                        />
                        <Input
                          placeholder="0.05"
                          value={svc.iss_rate ?? ""}
                          onChange={(e) => updateService(svc.id, "iss_rate", e.target.value)}
                          required
                          className="h-8 text-sm tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => removeService(svc.id)}
                          disabled={services.length === 1}
                          className={cn(
                            "flex items-center justify-center size-8 rounded-md text-muted-foreground/40 transition-colors",
                            "hover:text-destructive hover:bg-destructive/10",
                            "disabled:pointer-events-none disabled:opacity-20",
                          )}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card: Despesas ─────────────────────────────────────────────── */}
          <Card className="rounded-xl border-muted/50 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingDown className="size-4 text-muted-foreground" />
                  Despesas
                  {validExpenses.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                      {validExpenses.length}
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExpense}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="size-3" />
                  Adicionar
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                A IA classifica automaticamente a elegibilidade de cada despesa para crédito de{" "}
                <TermTooltip term="IBS">—</TermTooltip>/<TermTooltip term="CBS">—</TermTooltip>.
              </p>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                  <TrendingDown className="size-8 opacity-30" />
                  <p className="text-sm">Nenhuma despesa adicionada</p>
                  <p className="text-xs opacity-70">Despesas elegíveis viram créditos tributários</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_112px_32px] gap-2 mb-2 px-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Descrição</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Valor (R$)</span>
                    <span />
                  </div>
                  <div className="space-y-1.5">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="grid grid-cols-[1fr_112px_32px] gap-2 items-center group">
                        <Input
                          placeholder="AWS, GitHub, Aluguel..."
                          value={exp.description ?? ""}
                          onChange={(e) => updateExpense(exp.id, "description", e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Input
                          placeholder="3000.00"
                          value={exp.amount ?? ""}
                          onChange={(e) => updateExpense(exp.id, "amount", e.target.value)}
                          className="h-8 text-sm tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => removeExpense(exp.id)}
                          className={cn(
                            "flex items-center justify-center size-8 rounded-md text-muted-foreground/40 transition-colors",
                            "hover:text-destructive hover:bg-destructive/10",
                          )}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Coluna 3 — Card Sticky de Preview ────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-[4.5rem] space-y-3">
            <Card className="rounded-xl border-muted/50 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
              <div className="bg-primary px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                  Resultado Projetado
                </p>
                <p className="text-lg font-bold text-primary-foreground mt-0.5">
                  {year} · <TermTooltip term="CBS">CBS</TermTooltip>/<TermTooltip term="IBS">IBS</TermTooltip>
                </p>
              </div>

              <CardContent className="p-4 space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Receita estimada</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {totalReceita > 0
                        ? totalReceita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-muted-foreground">Despesas informadas</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {totalDespesas > 0
                        ? totalDespesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline border-t pt-2.5">
                    <span className="text-xs text-muted-foreground">Itens configurados</span>
                    <span className="text-sm font-semibold tabular-nums">
                      {validServices.length} serv. · {validExpenses.length} desp.
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 rounded-lg bg-accent/8 border border-accent/20 p-2.5">
                  <Sparkles className="size-3.5 text-accent mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A IA classifica cada despesa consultando a LC 68/2024 via RAG antes de calcular o impacto.
                  </p>
                </div>

                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="size-3 mt-0.5 shrink-0" />
                  <span>
                    Simulação considera regime de{" "}
                    <TermTooltip term="Split Payment">Split Payment</TermTooltip>{" "}
                    previsto para {year}.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || validServices.length === 0}
                  className={cn(
                    "w-full h-12 rounded-lg text-sm font-semibold transition-all duration-200",
                    "bg-zinc-900 text-white hover:bg-zinc-800",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Classificando e calculando…
                    </span>
                  ) : (
                    "Simular impacto tributário"
                  )}
                </button>

                {validServices.length === 0 && (
                  <p className="text-[11px] text-center text-muted-foreground">
                    Adicione ao menos um serviço para simular
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </form>
  )
}
