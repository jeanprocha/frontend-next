"use client"

// Carteira (FE-4, PR 4d) — home nova para usuários autenticados. Diferente
// do wrapper transitório de app/dashboard/companies/page.tsx (que ainda
// aplica template + navega para /simulador): aqui "Usar no simulador" abre
// o workspace do cliente — a identidade do cliente passa a viver na URL.
import { useRouter } from "next/navigation"
import { PortfolioPage } from "@/features/portfolio"
import { ROTAS } from "@/constants/routes"
import type { CompanyTemplate } from "@/types/api"

export default function ClientesPage() {
  const router = useRouter()

  function abrirWorkspace(company: CompanyTemplate) {
    router.push(ROTAS.cliente(company.id))
  }

  return <PortfolioPage aoUsarEmpresa={abrirWorkspace} breadcrumbItems={[{ label: "Clientes" }]} />
}
