"use client"

// Workspace do cliente (FE-4, PR 4d) — a URL carrega a identidade do
// cliente; nenhum campo de store guarda "empresa selecionada". No mount (ou
// troca de companyId) semeia o rascunho do form via aplicarContextoDoCliente
// e limpa resultados anteriores (RESULTS_CLEARED) — substitui o antigo canal
// templateApplyTick (morto na PR 4e).
import { use, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SimulationDashboard, useSimulationPipeline, RegistrosDoCliente } from "@/features/simulation"
import {
  ReportRenderer,
  anatomiaSection,
  boardMastheadSection,
  comparativoABSection,
  cronogramaSection,
  printMastheadSection,
  rodapeLegalSection,
  transicaoTabelaSection,
  vereditoSection,
  watermarkSection,
} from "@/features/report"
import { AnalystBriefingSheet, classificationReportSections } from "@/features/classification"
import { getImporterPanelEntries } from "@/features/import"
import { usePortfolioCompanies } from "@/features/portfolio"
import { useTaxStore } from "@/store/useTaxStore"
import { ROTAS } from "@/constants/routes"
import type { ReportRenderInput, ReportSection } from "@/lib/report-contract"

// Mesma ordem canónica de app/simulador/page.tsx — página↛página é banida
// pelo lint de fronteira (app/), então a composição duplica aqui em vez de
// vir de um módulo compartilhado (confirmado empiricamente: até um import
// relativo dentro de app/ dispara "Página não importa de página").
const DASHBOARD_SECTIONS: ReportSection[] = [
  printMastheadSection,
  boardMastheadSection,
  watermarkSection,
  vereditoSection,
  comparativoABSection,
  anatomiaSection,
  cronogramaSection,
  transicaoTabelaSection,
  ...classificationReportSections,
  rodapeLegalSection,
]

const IMPORTER_ENTRIES = getImporterPanelEntries()

export default function WorkspacePage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params)
  const router = useRouter()
  const { data: companies } = usePortfolioCompanies()
  const company = companies?.find((c) => c.id === companyId)
  const pipeline = useSimulationPipeline()
  const aplicarContextoDoCliente = useTaxStore((s) => s.aplicarContextoDoCliente)

  const semeadoRef = useRef<string | null>(null)
  useEffect(() => {
    if (!company || semeadoRef.current === company.id) return
    semeadoRef.current = company.id
    aplicarContextoDoCliente(company)
    pipeline.actions.clearResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda só quando `company` (identidade) muda; ações/setters são estáveis
  }, [company])

  if (!company) return null // layout.tsx já resolveu notFound() antes de renderizar esta página

  return (
    <>
      <SimulationDashboard
        companyId={companyId}
        nomeDoCliente={company.name}
        breadcrumbItems={[{ label: "Clientes", href: ROTAS.clientes }, { label: company.name }]}
        historyHref={ROTAS.cliente(companyId)}
        renderDossier={(input: Omit<ReportRenderInput, "sections">) => (
          <ReportRenderer {...input} sections={DASHBOARD_SECTIONS} />
        )}
        importerEntries={IMPORTER_ENTRIES}
      />
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <RegistrosDoCliente
          companyId={companyId}
          aoAbrirRegistro={(recordId) => router.push(ROTAS.clienteSimulacao(companyId, recordId))}
        />
      </div>
      <AnalystBriefingSheet />
    </>
  )
}
