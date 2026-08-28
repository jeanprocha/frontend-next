// Barrel público da feature report (FE-2 PR 2c/2d). app/ e dashboard-results-view
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
  memoriaDeCalculoSection,
  planoDeAcaoSection,
  transicaoTabelaSection,
  rodapeLegalSection,
} from "./sections"
