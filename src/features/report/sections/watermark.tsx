import { BoardReadyWatermark } from "../components/board-ready-header"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function WatermarkSection(_props: ReportSectionProps) {
  return <BoardReadyWatermark visible label="Gerado por TribIA Free" />
}

export const watermarkSection: ReportSection = {
  id: "watermark",
  title: "Marca d'água Free",
  capability: "freeWatermark",
  print: "board-only",
  Component: WatermarkSection,
}
