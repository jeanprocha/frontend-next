import { BoardReadyHeader } from "../components/board-ready-header"
import { useCapability } from "@/features/plg"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function BoardMastheadSection({ record }: ReportSectionProps) {
  const whiteLabelExport = useCapability("whiteLabelExport")
  return (
    <BoardReadyHeader
      companyContext={record.meta?.companyContext ?? undefined}
      year={record.simulation.year}
      createdAtIso={record.meta?.createdAt ?? null}
      whiteLabel={whiteLabelExport}
      clientBrandName={record.reportBrand?.org_name}
      clientLogoUrl={record.reportBrand?.logo_url}
    />
  )
}

export const boardMastheadSection: ReportSection = {
  id: "board-masthead",
  title: "Cabeçalho Board-Ready",
  print: "board-only",
  Component: BoardMastheadSection,
}
