"use client";

import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format-money";
import { parseApiDecimal } from "@/lib/money-decimal";
import { explainDestinationCredits } from "@/lib/transition-audit-copy";
import { cn } from "@/lib/utils";
import { FactorValue, FactorsTable, gridCellTooltip } from "./factors-table";
import { CalculationTracePanel } from "./calculation-trace-panel";
import type { TransitionSeriesPoint } from "@/types/api";

export interface TransitionAuditPanelBodyProps {
  focusYear: number;

  point: TransitionSeriesPoint | undefined;

  seriesEnriched?: boolean;

  /** Quando true, valores da tabela de fatores mostram tooltip de auditoria. */

  showFactorTooltips?: boolean;

  className?: string;
}

export function TransitionAuditPanelBody({
  focusYear,

  point,

  seriesEnriched,

  showFactorTooltips = false,

  className,
}: TransitionAuditPanelBodyProps) {
  const f = point?.factors;

  const creditsNote = seriesEnriched
    ? null
    : explainDestinationCredits(focusYear, point);

  const deltaParsed =
    point?.delta != null ? parseApiDecimal(point.delta) : null;

  const deltaSaving = deltaParsed && deltaParsed.lt(0);

  const deltaNeutral = !deltaParsed || deltaParsed.eq(0);

  return (
    <div className={cn("space-y-4 text-xs", className)}>
      {seriesEnriched ? (
        <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-[11px] leading-snug text-amber-950 dark:text-amber-100">
          Este registro foi reconstituído no servidor (líquidos e fatores de
          referência). O breakdown completo de bruto e créditos por ano fica
          gravado no histórico quando executar e guardar uma nova simulação.
        </p>
      ) : null}

      {point ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Conta armada
          </p>

          <p className="text-[11px] leading-snug text-muted-foreground">
            Blocos legado e destino no ano de foco; valores reprodutíveis para
            confronto com planilha externa.
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Legado líquido</span>

              <div className="font-mono tabular-nums">
                {showFactorTooltips ? (
                  <FactorValue
                    enabled
                    tooltip={gridCellTooltip(
                      focusYear,

                      "carga líquida no bloco legado (PIS/COFINS/ISS no modelo)",
                    )}
                  >
                    {formatBRL(point.old_tax_net)}
                  </FactorValue>
                ) : (
                  formatBRL(point.old_tax_net)
                )}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground">CBS/IBS líquido</span>

              <div className="font-mono tabular-nums">
                {showFactorTooltips ? (
                  <FactorValue
                    enabled
                    tooltip={gridCellTooltip(
                      focusYear,
                      "carga líquida no bloco CBS/IBS (destino)",
                    )}
                  >
                    {formatBRL(point.new_tax_net)}
                  </FactorValue>
                ) : (
                  formatBRL(point.new_tax_net)
                )}
              </div>
            </div>

            {point.delta != null && (
              <div>
                <span className="text-muted-foreground">
                  Delta (destino − legado)
                </span>

                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <div className="font-mono tabular-nums">
                    {showFactorTooltips ? (
                      <FactorValue
                        enabled
                        tooltip={gridCellTooltip(
                          focusYear,

                          "diferença entre carga líquida do destino e do legado no ano de foco (motor Go)",
                        )}
                      >
                        {formatBRL(point.delta)}
                      </FactorValue>
                    ) : (
                      formatBRL(point.delta)
                    )}
                  </div>

                  {!deltaNeutral && (
                    <Badge
                      className={cn(
                        "border-0 px-2 py-0.5 text-[10px] font-semibold",

                        deltaSaving
                          ? "bg-emerald-600 text-white hover:bg-emerald-600"
                          : "bg-amber-600 text-white hover:bg-amber-600",
                      )}
                    >
                      {deltaSaving ? "Economia projetada" : "Aumento de carga"}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {point.delta_pct != null && (
              <div>
                <span className="text-muted-foreground">Delta %</span>

                <div className="font-mono tabular-nums">
                  {showFactorTooltips ? (
                    <FactorValue
                      enabled
                      tooltip={gridCellTooltip(
                        focusYear,
                        "variação percentual associada ao delta no ano de foco",
                      )}
                    >
                      {point.delta_pct}%
                    </FactorValue>
                  ) : (
                    `${point.delta_pct}%`
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {creditsNote ? (
        <div className="rounded-md border border-sky-500/35 bg-sky-500/10 px-2.5 py-2.5 dark:border-sky-500/40 dark:bg-sky-950/35">
          <p className="flex items-start gap-2 text-[11px] leading-snug text-sky-950 dark:text-sky-100">
            <Info
              className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400"
              aria-hidden
            />

            <span>
              <span className="font-semibold text-sky-900 dark:text-sky-50">
                Insight de auditoria
              </span>

              <span className="mt-1 block text-sky-950/95 dark:text-sky-100">
                {creditsNote}
              </span>
            </span>
          </p>
        </div>
      ) : null}

      {f ? (
        <FactorsTable
          focusYear={focusYear}
          f={f}
          showTooltips={showFactorTooltips}
        />
      ) : (
        <p className="text-muted-foreground">
          Fatores não disponíveis para este registro.
        </p>
      )}

      {/* Etapa C, W2/PR3: decomposição por tributo + trace item a item — o
          que já existia acima ("Conta armada", fatores) mostra o AGREGADO;
          isto mostra COMO o motor chegou lá. Ausente em registro salvo antes
          da PR1/PR2 — CalculationTracePanel declara a ausência, não some
          em silêncio. */}
      <CalculationTracePanel current={point?.current} projected={point?.projected} basis={f?.basis} />
    </div>
  );
}
