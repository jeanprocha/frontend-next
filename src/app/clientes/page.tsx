"use client"

// Carteira (FE-4) — home nova para usuários autenticados. "Abrir workspace"
// navega para /clientes/[id] — a identidade do cliente vive na URL, nunca
// num template aplicado ao store.
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
