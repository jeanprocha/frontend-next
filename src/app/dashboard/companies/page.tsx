"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Building2, Plus, Receipt, Trash2, X } from "lucide-react"
import { createCompany, deleteCompany, listCompanies } from "@/lib/api"
import { useTaxStore } from "@/store/useTaxStore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { CompanyCreatePayload, CompanyTemplate, ServiceInput } from "@/types/api"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2)
}

interface DraftService {
  id: string
  description: string
  amount: string
  iss_rate: string
}

function toServiceInput(s: DraftService): ServiceInput {
  return { description: s.description, amount: s.amount, iss_rate: s.iss_rate }
}

// ─── Formulário inline de nova empresa ───────────────────────────────────────

function NewCompanyForm({ onClose, userId }: { onClose: () => void; userId: string }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [taxContext, setTaxContext] = useState("")
  const [services, setServices] = useState<DraftService[]>([
    { id: makeId(), description: "", amount: "", iss_rate: "0.05" },
  ])

  const mutation = useMutation({
    mutationFn: (payload: CompanyCreatePayload) => createCompany(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      onClose()
    },
  })

  function addService() {
    setServices((prev) => [
      ...prev,
      { id: makeId(), description: "", amount: "", iss_rate: "0.05" },
    ])
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  function updateService(id: string, field: keyof DraftService, value: string) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({
      name: name.trim(),
      tax_context: taxContext.trim(),
      default_services: services
        .filter((s) => s.description.trim() && s.amount.trim())
        .map(toServiceInput),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="size-4 text-accent" />
          Nova empresa
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Nome */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Nome da empresa *
        </Label>
        <Input
          placeholder="ex: Tribunal de Justiça do RS"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-9"
        />
      </div>

      {/* Contexto tributário */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Contexto tributário
          <span className="ml-1 text-accent normal-case font-normal">(usado pela IA)</span>
        </Label>
        <Input
          placeholder="ex: Órgão público municipal, regime especial ISS..."
          value={taxContext}
          onChange={(e) => setTaxContext(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Serviços recorrentes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Serviços recorrentes
          </Label>
          <Button type="button" variant="outline" size="sm" onClick={addService} className="h-6 gap-1 text-xs">
            <Plus className="size-3" />
            Adicionar
          </Button>
        </div>

        {services.length > 0 && (
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1fr_100px_80px_28px] gap-2 px-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Descrição</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Valor (R$)</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Alíq. ISS</span>
              <span />
            </div>
            {services.map((svc) => (
              <div key={svc.id} className="grid grid-cols-[1fr_100px_80px_28px] gap-2 items-center">
                <Input
                  placeholder="Consultoria de TI"
                  value={svc.description}
                  onChange={(e) => updateService(svc.id, "description", e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  placeholder="10000.00"
                  value={svc.amount}
                  onChange={(e) => updateService(svc.id, "amount", e.target.value)}
                  className="h-8 text-xs tabular-nums"
                />
                <Input
                  placeholder="0.05"
                  value={svc.iss_rate}
                  onChange={(e) => updateService(svc.id, "iss_rate", e.target.value)}
                  className="h-8 text-xs tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => removeService(svc.id)}
                  disabled={services.length === 1}
                  className="flex items-center justify-center size-7 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-20 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive">
          {(mutation.error as Error).message ?? "Erro ao criar empresa."}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={mutation.isPending || !name.trim()}>
          {mutation.isPending ? "Salvando…" : "Salvar empresa"}
        </Button>
      </div>
    </form>
  )
}

// ─── Card de empresa ──────────────────────────────────────────────────────────

function CompanyCard({
  company,
  userId,
  onUse,
}: {
  company: CompanyTemplate
  userId: string
  onUse: (c: CompanyTemplate) => void
}) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteCompany(userId, company.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["companies"] }),
  })

  function handleDelete() {
    if (!window.confirm(`Excluir "${company.name}"? Esta ação não pode ser desfeita.`)) return
    deleteMutation.mutate()
  }

  const services = company.default_services ?? []

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-accent/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{company.name}</h3>
          {company.tax_context && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {company.tax_context}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="shrink-0 flex items-center justify-center size-7 rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-colors"
          title="Excluir empresa"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {services.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Receipt className="size-3" />
            Serviços recorrentes
          </p>
          <div className="flex flex-wrap gap-1">
            {services.slice(0, 4).map((s, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                {s.description || "Serviço"}
              </Badge>
            ))}
            {services.length > 4 && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                +{services.length - 4}
              </Badge>
            )}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs gap-1.5"
        onClick={() => onUse(company)}
      >
        <Receipt className="size-3" />
        Usar no simulador
      </Button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const applyCompanyTemplate = useTaxStore((s) => s.applyCompanyTemplate)

  const { data: companies, isPending, isError } = useQuery({
    queryKey: ["companies", userId],
    queryFn: () => listCompanies(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  })

  function handleUse(company: CompanyTemplate) {
    applyCompanyTemplate(company)
    router.push("/dashboard")
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="size-5 text-accent" />
            Empresas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre clientes com contexto e serviços recorrentes para pré-carregar o simulador em um clique.
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          <Plus className="size-4" />
          Nova empresa
        </Button>
      </div>

      {/* Formulário inline */}
      {showForm && userId && (
        <NewCompanyForm userId={userId} onClose={() => setShowForm(false)} />
      )}

      {/* Estado de carregamento */}
      {isPending && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-7 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Estado de erro */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="text-sm text-destructive">Erro ao carregar empresas. Tente novamente.</p>
        </div>
      )}

      {/* Lista */}
      {!isPending && !isError && companies && companies.length > 0 && (
        <div className={cn("grid gap-3 sm:grid-cols-2")}>
          {companies.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              userId={userId!}
              onUse={handleUse}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isPending && !isError && (!companies || companies.length === 0) && !showForm && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground opacity-60">
          <Building2 className="size-10" aria-hidden />
          <p className="text-sm font-medium">Nenhuma empresa cadastrada ainda.</p>
          <p className="text-xs text-center max-w-xs">
            Clique em "Nova empresa" para cadastrar um cliente com contexto tributário e serviços recorrentes.
          </p>
        </div>
      )}
    </div>
  )
}
