import { ShieldCheck } from "lucide-react"
import { getAiSuggestedLabel, getEffectiveLabel } from "@/lib/classification-effective"
import type { ClassificationItem } from "@/types/api"

/** Tooltip de auditoria (rastro IA ↔ consultor) — usado pela badge de override na Mesa. */
export function OverrideAuditTooltip({
  classification,
  presentationMode,
}: {
  classification: ClassificationItem
  presentationMode: boolean
}) {
  const aiLabel = getAiSuggestedLabel(classification)
  const effLabel = getEffectiveLabel(classification)
  const note = classification.consultant_override?.justification?.trim()
  const at = classification.consultant_override?.overridden_at

  return (
    <div className="space-y-1.5">
      {presentationMode ? (
        /*
         * Board-Ready: única linha em serif ("narrativa executiva").
         * Restante permanece Geist Sans.
         */
        <p className="font-board-report text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          Validação humana realizada
        </p>
      ) : (
        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="size-3" aria-hidden />
          Curado pelo consultor
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        <span className="text-foreground/80">Sugerido pela IA:</span>{" "}
        <span className="font-medium">{aiLabel}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="text-foreground/80">Definido pelo consultor:</span>{" "}
        <span className="font-medium text-foreground">{effLabel}</span>
      </p>
      {note && (
        <p className="text-xs text-muted-foreground border-t border-border/60 pt-1.5 leading-snug">
          <span className="font-medium text-foreground/80">Nota do Especialista:</span> {note}
        </p>
      )}
      {at && (
        <p className="text-[10px] text-muted-foreground/60">
          {new Date(at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  )
}
