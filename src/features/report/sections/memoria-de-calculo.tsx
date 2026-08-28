import { TransitionAuditPanel } from "../components/transition-audit-panel"
import { CalculationTracePrint } from "../components/calculation-trace-print"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"

/**
 * Etapa C, W2/PR3 (docs/roadmap-execucao.md 4.1) — promove o painel "Memória
 * de cálculo" (que já existia com esse nome, embutido dentro de cronograma,
 * sem seção própria e sem print: só existia na tela) a ReportSection própria
 * do registry. Fecha o aceite do W2: "um contador refaz a conta do PDF
 * usando apenas o documento".
 *
 * screenTab "cronograma": mesma aba de sempre no modo screen-tabs — a
 * separação em seção própria é técnica (registry), não muda a navegação que
 * o usuário já conhece.
 */
function MemoriaDeCalculoSection({ record, focusYear }: ReportSectionProps) {
  const point = record.simulation.transition_series?.find((p) => p.year === focusYear)

  return (
    <section
      id="tribia-journey-memoria-calculo"
      className="scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent"
    >
      <div className="p-5 sm:p-6 print:p-0">
        <TransitionAuditPanel
          focusYear={focusYear}
          point={point}
          seriesEnriched={record.simulation.transition_series_enriched === true}
        />
        <CalculationTracePrint point={point} focusYear={focusYear} />
      </div>
    </section>
  )
}

export const memoriaDeCalculoSection: ReportSection = {
  id: "memoria-de-calculo",
  title: "Memória de cálculo",
  print: "always",
  screenTab: "cronograma",
  Component: MemoriaDeCalculoSection,
}
