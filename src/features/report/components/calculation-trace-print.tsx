import { CalculationTracePanel } from "./calculation-trace-panel"
import type { TransitionSeriesPoint } from "@/types/api"

/**
 * Gêmeo sempre-visível na impressão de CalculationTracePanel — mesmo padrão
 * de TransitionPrintTable/transicaoTabelaSection (ReportPrintMode
 * "print-only": `hidden print:block`).
 *
 * Existe porque o painel interativo em tela (TransitionAuditPanel) é um
 * collapsible que começa FECHADO — o conteúdo só entra no DOM quando o
 * usuário clica (`{open && (...)}`). `window.print()` (o mecanismo real de
 * "Exportar para PDF" deste produto — ver achado 6, docs/roadmap-execucao.md
 * 4.1) imprime o DOM como está: um painel fechado no momento da impressão
 * simplesmente NÃO aparece no PDF, contradizendo o aceite do W2 ("um
 * contador refaz a conta do PDF"). Este componente nunca depende de estado
 * de UI — está sempre no DOM, só visualmente oculto até a mídia de
 * impressão.
 */
export function CalculationTracePrint({ point, focusYear }: { point: TransitionSeriesPoint | undefined; focusYear: number }) {
  const hasTrace = (point?.current?.trace?.length ?? 0) > 0 || (point?.projected?.trace?.length ?? 0) > 0
  if (!hasTrace) return null

  return (
    <div className="hidden print:block print:mt-6 print:break-inside-avoid">
      <h3 className="font-board-report mb-3 border-b border-foreground/20 pb-2 text-sm font-semibold text-foreground">
        Memória de cálculo — {focusYear}
      </h3>
      <CalculationTracePanel current={point?.current} projected={point?.projected} basis={point?.factors?.basis} />
    </div>
  )
}
