import { PrintReportHeader } from "../components/print-report-chrome"
import { useCapability } from "@/features/plg"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function PrintMastheadSection({ record, sessionCompanyLabel, sessionScenarioLabel }: ReportSectionProps) {
  const whiteLabelExport = useCapability("whiteLabelExport")
  return (
    <PrintReportHeader
      generatedAtIso={record.meta?.createdAt}
      whiteLabel={whiteLabelExport}
      clientBrandName={record.reportBrand?.org_name}
      clientLogoUrl={record.reportBrand?.logo_url}
      simulationContextLine={sessionCompanyLabel || undefined}
      scenarioLine={sessionScenarioLabel || undefined}
    />
  )
}

export const printMastheadSection: ReportSection = {
  id: "print-masthead",
  title: "Cabeçalho de impressão",
  print: "print-only",
  Component: PrintMastheadSection,
}
