// Barrel público da feature classification (FE-2 PR 2d). app/ só importa
// daqui — nunca de features/classification/{components,lib,sections}/*
// directamente (lint de fronteira).
import type { ReportSection } from "@/lib/report-contract"
import { dossieRagSection } from "./sections/dossie-rag"
import { coberturaLegalAuditoriaSection } from "./sections/cobertura-legal-auditoria"
import { mesaRastreabilidadeSection } from "./sections/mesa-rastreabilidade"
import { fundamentacaoCreditosSection } from "./sections/fundamentacao-creditos"

export { AnalystBriefingSheet } from "./components/analyst-briefing-sheet"

/** Secções do dossié "donas" do domínio classification — compostas por app/ junto às de features/report. */
export const classificationReportSections: ReportSection[] = [
  dossieRagSection,
  coberturaLegalAuditoriaSection,
  mesaRastreabilidadeSection,
  fundamentacaoCreditosSection,
]
