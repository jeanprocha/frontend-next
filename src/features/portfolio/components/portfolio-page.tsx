"use client"

// Corpo de app/dashboard/companies/page.tsx (FE-4, PR 4c — move puro). O
// wrapper em app/ injeta aoUsarEmpresa/breadcrumbItems com os MESMOS
// valores de antes (comportamento idêntico) — os literais de rota saem
// daqui para não travar a feature numa rota específica.
import { useEffect, useState } from "react"
import { Building2, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-client"
import { ShellBreadcrumb, type ShellBreadcrumbItem } from "@/components/shell/shell-breadcrumb"
import { patchDashboardCommandBridge } from "@/lib/dashboard-command-bridge"
import { shellPageClass } from "@/lib/shell-layout"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyCard } from "./company-card"
import { NewCompanyForm } from "./new-company-form"
import { usePortfolioCompanies } from "../hooks/use-portfolio-companies"
import type { CompanyTemplate } from "@/types/api"

export interface PortfolioPageProps {
  aoUsarEmpresa: (company: CompanyTemplate) => void
  breadcrumbItems: ShellBreadcrumbItem[]
}

export function PortfolioPage({ aoUsarEmpresa, breadcrumbItems }: PortfolioPageProps) {
  const { userId } = useAuth()
  const [showForm, setShowForm] = useState(false)

  const { data: companies, isPending, isError } = usePortfolioCompanies()

  useEffect(() => {
    patchDashboardCommandBridge({
      openCompaniesNewForm: () => setShowForm(true),
    })
    return () => patchDashboardCommandBridge({ openCompaniesNewForm: null })
  }, [])

  return (
    <div className={shellPageClass()}>
      <ShellBreadcrumb items={breadcrumbItems} />

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
        <NewCompanyForm onClose={() => setShowForm(false)} />
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
            <CompanyCard key={c.id} company={c} onUse={aoUsarEmpresa} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isPending && !isError && (!companies || companies.length === 0) && !showForm && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground opacity-60">
          <Building2 className="size-10" aria-hidden />
          <p className="text-sm font-medium">Nenhuma empresa cadastrada ainda.</p>
          <p className="text-xs text-center max-w-xs">
            Clique em «Nova empresa» para cadastrar um cliente com contexto tributário e serviços recorrentes.
            Perfis guardados aqui aceleram o pipeline de simulação no painel principal.
          </p>
        </div>
      )}
    </div>
  )
}
