"use client"

import { AnalystBriefingSheet } from "@/components/tax/analyst-briefing-sheet"
import { SimulationDashboard } from "@/features/simulation"
import {
  ReportRenderer,
  anatomiaSection,
  boardMastheadSection,
  comparativoABSection,
  coberturaLegalAuditoriaSection,
  cronogramaSection,
  dossieRagSection,
  fundamentacaoCreditosSection,
  mesaRastreabilidadeSection,
  printMastheadSection,
  rodapeLegalSection,
  transicaoTabelaSection,
  vereditoSection,
  watermarkSection,
} from "@/features/report"
import type { ReportRenderInput, ReportSection } from "@/lib/report-contract"

// Ordem canónica do dossié logado — mastheads/rodapé de impressão intercalados
// com o conteúdo na ordem em que aparecem no papel (board/print); em
// screen-tabs só o conteúdo da aba activa monta (ver ReportRenderer).
const DASHBOARD_SECTIONS: ReportSection[] = [
  printMastheadSection,
  boardMastheadSection,
  watermarkSection,
  vereditoSection,
  comparativoABSection,
  anatomiaSection,
  cronogramaSection,
  transicaoTabelaSection,
  dossieRagSection,
  coberturaLegalAuditoriaSection,
  mesaRastreabilidadeSection,
  fundamentacaoCreditosSection,
  rodapeLegalSection,
]

export default function DashboardPage() {
  return (
    <>
      <SimulationDashboard
        renderDossier={(input: Omit<ReportRenderInput, "sections">) => (
          <ReportRenderer {...input} sections={DASHBOARD_SECTIONS} />
        )}
      />
      <AnalystBriefingSheet />
    </>
  )
}
