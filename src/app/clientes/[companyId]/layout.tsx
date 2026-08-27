"use client"

// Primeiro layout aninhado do projeto (FE-4, PR 4d). Job único: resolver o
// cliente da URL contra a lista de companies (não há GET /companies/{id} —
// ver doc §9) e chamar notFound() UMA vez, protegendo tanto page.tsx quanto
// simulacoes/[recordId]/page.tsx com o mesmo gate. Sem chrome visual próprio
// (sem breadcrumb/header aqui) — cada página injeta seu próprio
// breadcrumbItems/nomeDoCliente em SimulationDashboard; duplicar aqui criaria
// dois cabeçalhos.
import { use } from "react"
import { notFound } from "next/navigation"
import { Loader2 } from "lucide-react"
import { usePortfolioCompanies } from "@/features/portfolio"

export default function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = use(params)
  const { data: companies, isPending } = usePortfolioCompanies()

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span className="sr-only">Carregando cliente…</span>
      </div>
    )
  }

  const company = companies?.find((c) => c.id === companyId)
  if (!company) notFound()

  return <>{children}</>
}
