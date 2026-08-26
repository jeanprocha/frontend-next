import { formatBRL } from "@/lib/format-money"
import type { SimulationResponse } from "@/types/api"

/** Tabela de auditoria da transição — visível só na impressão (Board-Ready). */
export function TransitionPrintTable({ simulation }: { simulation: SimulationResponse }) {
  const series = simulation.transition_series
  if (!series?.length) return null

  const sorted = [...series].sort((a, b) => a.year - b.year)

  return (
    <div className="hidden print:block print:mt-8 print:break-inside-avoid">
      <h3 className="font-board-report text-sm font-semibold text-foreground border-b border-foreground/20 pb-2 mb-3">
        Transição 2026–2033 (legado vs CBS/IBS — modelo TribIA)
      </h3>
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="border-b border-foreground/30 text-left">
            <th className="py-1 pr-2 font-semibold">Ano</th>
            <th className="py-1 pr-2 font-semibold">Legado líquido</th>
            <th className="py-1 pr-2 font-semibold">CBS/IBS líquido</th>
            <th className="py-1 font-semibold">Factor PIS/COFINS</th>
            <th className="py-1 font-semibold">CBS</th>
            <th className="py-1 font-semibold">IBS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.year} className="border-b border-foreground/10">
              <td className="py-0.5 pr-2 tabular-nums">{p.year}</td>
              <td className="py-0.5 pr-2 font-mono tabular-nums">{formatBRL(p.old_tax_net)}</td>
              <td className="py-0.5 pr-2 font-mono tabular-nums">{formatBRL(p.new_tax_net)}</td>
              <td className="py-0.5 font-mono">{p.factors?.pis_cofins_factor ?? "—"}</td>
              <td className="py-0.5 font-mono">{p.factors?.cbs_rate ?? "—"}</td>
              <td className="py-0.5 font-mono">{p.factors?.ibs_rate ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
