"use client"

// Abrir um registo específico dentro do workspace do cliente (FE-4, PR 4d).
// Sem push: esta página É o destino — hidrata a máquina UMA vez e renderiza
// o mesmo SimulationDashboard do workspace. Se o registo pertencer a outro
// cliente (company_id diferente do da URL), corrige a URL via replace.
import { use, useEffect, useRef } from "react"
import { useRouter, notFound } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-client"
import { getSimulationRecord, queryKeys } from "@/lib/api"
import {
  detailServicesToFormServices,
  parseCompanyRegimeFromDetail,
  simulationDetailToPersisted,
} from "@/lib/history-hydrate"
import { SimulationDashboard, useSimulationPipeline } from "@/features/simulation"
import {
  ReportRenderer,
  anatomiaSection,
  boardMastheadSection,
  comparativoABSection,
  cronogramaSection,
  memoriaDeCalculoSection,
  printMastheadSection,
  rodapeLegalSection,
  transicaoTabelaSection,
  vereditoSection,
  watermarkSection,
} from "@/features/report"
import { AnalystBriefingSheet, classificationReportSections } from "@/features/classification"
import { getImporterPanelEntries } from "@/features/import"
import { baseLegalSeloSection } from "@/features/legal-corpus"
import { motorValidadoSeloSection } from "@/features/engine-validation"
import { usePortfolioCompanies } from "@/features/portfolio"
import { useTaxStore } from "@/store/useTaxStore"
import { ROTAS } from "@/constants/routes"
import type { ReportRenderInput, ReportSection } from "@/lib/report-contract"

// Mesma composição de app/simulador/page.tsx e app/clientes/[companyId]/page.tsx
// — página↛página é banida pelo lint de fronteira (app/), daí a duplicação.
const DASHBOARD_SECTIONS: ReportSection[] = [
  printMastheadSection,
  boardMastheadSection,
  watermarkSection,
  baseLegalSeloSection,
  motorValidadoSeloSection,
  vereditoSection,
  comparativoABSection,
  anatomiaSection,
  cronogramaSection,
  memoriaDeCalculoSection,
  transicaoTabelaSection,
  ...classificationReportSections,
  rodapeLegalSection,
]

const IMPORTER_ENTRIES = getImporterPanelEntries()

export default function WorkspaceRecordPage({
  params,
}: {
  params: Promise<{ companyId: string; recordId: string }>
}) {
  const { companyId, recordId } = use(params)
  const router = useRouter()
  const { userId, isLoaded, getToken } = useAuth()
  const { data: companies } = usePortfolioCompanies()
  const company = companies?.find((c) => c.id === companyId)
  const pipeline = useSimulationPipeline()
  const { setYear, setCompanyContext, setCompanyRegime, setServices, setExpenses } = useTaxStore()

  const { data: detail, isPending, isError } = useQuery({
    queryKey: queryKeys.simulationRecords.detail(userId, recordId),
    queryFn: async () => {
      const token = await getToken()
      if (!token || !userId) throw new Error("Não autenticado")
      return getSimulationRecord(token, userId, recordId)
    },
    enabled: isLoaded && !!userId && !!recordId,
    retry: false,
  })

  const hidratadoRef = useRef<string | null>(null)
  useEffect(() => {
    if (!detail || hidratadoRef.current === detail.id) return
    hidratadoRef.current = detail.id

    if (detail.company_id && detail.company_id !== companyId) {
      router.replace(ROTAS.clienteSimulacao(detail.company_id, detail.id))
      return
    }

    setYear(detail.year)
    setCompanyContext(detail.company_context)
    setCompanyRegime(parseCompanyRegimeFromDetail(detail))
    setServices(detailServicesToFormServices(detail.services))
    setExpenses(detail.expenses.map((e) => ({ id: e.id, description: e.description, amount: e.amount })))
    pipeline.actions.hydrateResults(
      simulationDetailToPersisted(detail, {
        createdAt: detail.created_at,
        companyContext: detail.company_context ?? "",
        year: detail.year,
        recordId: detail.id,
        companyId: detail.company_id ?? companyId,
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda só quando `detail` (identidade do registo) muda; setters/ações são estáveis
  }, [detail])

  if (isError) notFound()
  if (isPending || !company) return null // layout.tsx já resolveu notFound() do cliente; aqui só falta o registo carregar

  return (
    <>
      <SimulationDashboard
        companyId={companyId}
        nomeDoCliente={company.name}
        breadcrumbItems={[
          { label: "Clientes", href: ROTAS.clientes },
          { label: company.name, href: ROTAS.cliente(companyId) },
          { label: "Simulação" },
        ]}
        historyHref={ROTAS.cliente(companyId)}
        renderDossier={(input: Omit<ReportRenderInput, "sections">) => (
          <ReportRenderer {...input} sections={DASHBOARD_SECTIONS} />
        )}
        importerEntries={IMPORTER_ENTRIES}
      />
      <AnalystBriefingSheet />
    </>
  )
}
