import { getAiSuggestedLabel, getEffectiveLabel, hasConsultantOverride } from "@/lib/classification-effective"
import type { ClassificationItem } from "@/types/api"

function formatOverriddenAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Gêmeo sempre-visível na impressão da trilha IA × consultor — mesmo padrão
 * de CalculationTracePrint/TransitionPrintTable (`hidden print:block`).
 *
 * Existe porque hoje a única superfície desse rastro é OverrideAuditTooltip
 * (classification-override-cell.tsx), um Radix Tooltip: só entra no DOM sob
 * hover/foco, nunca ao imprimir. `window.print()` é o mecanismo real de
 * "Exportar para PDF" deste produto (achado 6, docs/roadmap-execucao.md
 * 4.1) — sem este gêmeo, um dossiê impresso com uma linha divergente não
 * mostraria a divergência, mesmo que o override tivesse sido aplicado e
 * persistido. Nunca depende de hover/clique.
 *
 * Montado em fundamentacao-creditos.tsx (a cédula canônica do documento —
 * decisão B1): a Mesa de operações só existe na aba "Mesa" do screen-tabs e
 * não participa do board/público/impresso.
 */
export function DivergenceTrailPrint({ classifications }: { classifications: ClassificationItem[] }) {
  const divergent = classifications.filter(hasConsultantOverride)
  if (divergent.length === 0) return null

  return (
    <div className="hidden print:mt-6 print:block print:break-inside-avoid">
      <h3 className="font-board-report mb-3 border-b border-foreground/20 pb-2 text-sm font-semibold text-foreground">
        Trilha de divergência — IA × consultor
      </h3>
      <ul className="space-y-3">
        {divergent.map((c) => {
          const override = c.consultant_override!
          const note = override.justification?.trim()
          const at = formatOverriddenAt(override.overridden_at)
          return (
            <li key={c.client_id ?? c.description} className="text-xs leading-relaxed text-foreground/85">
              <p className="font-medium text-foreground">{c.description}</p>
              <p>
                <span className="text-foreground/70">Sugerido pela IA:</span> {getAiSuggestedLabel(c)}
              </p>
              <p>
                <span className="text-foreground/70">Definido pelo consultor:</span> {getEffectiveLabel(c)}
              </p>
              {note && (
                <p>
                  <span className="text-foreground/70">Nota do Especialista:</span> {note}
                </p>
              )}
              {at && <p className="text-[10px] text-foreground/60">{at}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
