import { TransitionPrintTable } from "../components/transition-print-table"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

function TransicaoTabelaSection({ record }: ReportSectionProps) {
  return <TransitionPrintTable simulation={record.simulation} />
}

export const transicaoTabelaSection: ReportSection = {
  id: "transicao-tabela",
  title: "Tabela de transição (impressão)",
  print: "print-only",
  Component: TransicaoTabelaSection,
}
