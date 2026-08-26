// Barrel público da feature report (FE-2 PR 2c). app/ e dashboard-results-view
// (via prop renderDossier, nunca import direto — simulation ↛ report) só
// importam daqui.
export { ReportRenderer } from "./report-renderer"
export { PublicReport } from "./public-report"
export {
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
} from "./sections"
