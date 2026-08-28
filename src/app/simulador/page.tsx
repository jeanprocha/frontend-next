"use client"

// Movido de app/dashboard/page.tsx (FE-4, PR 4d — move puro): simulador
// avulso, sem cliente da carteira. companyId/nomeDoCliente ficam ausentes
// (defaults de SimulationDashboardProps assumem o caminho avulso).
import { SimulationDashboard } from "@/features/simulation"
import {
  ReportRenderer,
  anatomiaSection,
  boardMastheadSection,
  comparativoABSection,
  cronogramaSection,
  memoriaDeCalculoSection,
  planoDeAcaoSection,
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
import type { ReportRenderInput, ReportSection } from "@/lib/report-contract"

// Ordem canónica do dossié logado — mastheads/rodapé de impressão intercalados
// com o conteúdo na ordem em que aparecem no papel (board/print); em
// screen-tabs só o conteúdo da aba activa monta (ver ReportRenderer).
// classificationReportSections agrupa dossie-rag, cobertura-legal-auditoria,
// mesa-rastreabilidade e fundamentacao-creditos — donas do domínio classification.
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
  planoDeAcaoSection,
  transicaoTabelaSection,
  ...classificationReportSections,
  rodapeLegalSection,
]

const IMPORTER_ENTRIES = getImporterPanelEntries()

export default function SimuladorPage() {
  return (
    <>
      <SimulationDashboard
        renderDossier={(input: Omit<ReportRenderInput, "sections">) => (
          <ReportRenderer {...input} sections={DASHBOARD_SECTIONS} />
        )}
        importerEntries={IMPORTER_ENTRIES}
      />
      <AnalystBriefingSheet />
    </>
  )
}
