import { PrintReportFooter } from "@/components/tax/print-report-chrome"
import { useCapability } from "@/features/plg"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function RodapeLegalSection({ comparison }: ReportSectionProps) {
  const whiteLabelExport = useCapability("whiteLabelExport")
  const freeWatermark = useCapability("freeWatermark")
  return (
    <PrintReportFooter
      whiteLabel={whiteLabelExport}
      freeWatermark={freeWatermark}
      isComparing={Boolean(comparison)}
    />
  )
}

export const rodapeLegalSection: ReportSection = {
  id: "rodape-legal",
  title: "Rodapé legal (impressão)",
  print: "print-only",
  Component: RodapeLegalSection,
}
