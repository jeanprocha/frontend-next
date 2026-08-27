"use client"

// Wrapper fino (FE-4, PR 4c — move puro): o corpo virou features/portfolio.
import { useRouter } from "next/navigation"
import { useTaxStore } from "@/store/useTaxStore"
import { PortfolioPage } from "@/features/portfolio"
import type { CompanyTemplate } from "@/types/api"

export default function CompaniesPage() {
  const router = useRouter()
  const applyCompanyTemplate = useTaxStore((s) => s.applyCompanyTemplate)

  function handleUse(company: CompanyTemplate) {
    applyCompanyTemplate(company)
    router.push("/dashboard")
  }

  return (
    <PortfolioPage
      aoUsarEmpresa={handleUse}
      breadcrumbItems={[
        { label: "Simulador", href: "/dashboard" },
        { label: "Empresas" },
      ]}
    />
  )
}
