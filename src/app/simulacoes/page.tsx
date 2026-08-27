"use client"

// Movido de app/dashboard/history/page.tsx (FE-4, PR 4d — move puro):
// histórico global (todos os clientes + registos legados sem company_id).
import { useRouter } from "next/navigation"
import { HistoryPageView } from "@/features/simulation"
import { ROTAS } from "@/constants/routes"

export default function SimulacoesPage() {
  const router = useRouter()
  const goToSimulador = () => router.push(ROTAS.simulador)

  return (
    <HistoryPageView
      breadcrumbItems={[
        { label: "Simulador", href: ROTAS.simulador },
        { label: "Simulações" },
      ]}
      hrefSimulador={ROTAS.simulador}
      aoAbrirRegistro={goToSimulador}
      aoCompararCenarios={goToSimulador}
    />
  )
}
