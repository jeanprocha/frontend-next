"use client"

import { PublicReport } from "@/features/report"
import {
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
import { classificationReportSections } from "@/features/classification"
import type { ReportSection } from "@/lib/report-contract"

// Ordem canónica do dossié — igual à do dashboard logado
// (arquitetura-frontend.md §6). classificationReportSections agrupa
// dossie-rag, cobertura-legal-auditoria, mesa-rastreabilidade e
// fundamentacao-creditos — donas do domínio classification.
//
// Componente cliente: a lista de secções carrega referências de componentes
// (ReportSection.Component), que não atravessam a fronteira Server→Client do
// Next (RSC só serializa primitivos). page.tsx (Server Component, dono do
// generateMetadata) só resolve `id` e delega a composição aqui.
const PUBLIC_REPORT_SECTIONS: ReportSection[] = [
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

export function PublicReportPage({ id }: { id: string }) {
  return <PublicReport id={id} sections={PUBLIC_REPORT_SECTIONS} />
}
