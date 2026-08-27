"use client"

// Wrapper fino (FE-4, PR 4c — move puro): o corpo virou
// features/simulation/components/history-page-view.tsx.
import { useRouter } from "next/navigation"
import { HistoryPageView } from "@/features/simulation"

export default function HistoryPage() {
  const router = useRouter()
  const goToSimulador = () => router.push("/dashboard")

  return (
    <HistoryPageView
      breadcrumbItems={[
        { label: "Simulador", href: "/dashboard" },
        { label: "Histórico" },
      ]}
      hrefSimulador="/dashboard"
      aoAbrirRegistro={goToSimulador}
      aoCompararCenarios={goToSimulador}
    />
  )
}
