import { Badge } from "@/components/ui/badge"
import { ExpenseConfidenceSignal } from "./expense-confidence-signal"
import { hasConsultantOverride, type EffectiveSimulationFields } from "@/lib/classification-effective"
import { cn } from "@/lib/utils"
import type { ClassificationItem } from "@/types/api"

/**
 * Badges e acento de status compartilhados entre a linha de detalhe (≥ sm /
 * impressão) e o cartão mobile do ExpenseTable — uma única fonte de verdade
 * para elegibilidade, regime, risco e sinal de confiança.
 */

const RISK_LABEL: Record<string, string> = { baixo: "baixo", medio: "médio", alto: "alto" }

// Mesma linguagem visual de PRIORITY_BADGE_CLASS (plano-de-acao.tsx) e
// confidenceTierBadgeClassName: baixo é o tratamento mais leve, alto o mais
// forte — o peso visual segue a severidade (achado do critique: a badge de
// risco estava invertida, "baixo" ganhava a pill mais pesada).
const RISK_BADGE_CLASS: Record<string, string> = {
  baixo: "border-border bg-muted/40 text-muted-foreground",
  medio: "border-amber-500/50 bg-amber-500/12 text-amber-950 dark:text-amber-100",
  alto: "border-red-500/45 bg-red-500/10 text-red-950 dark:text-red-200",
}

const REGIME_LABEL: Record<string, string> = {
  diferenciado_60: "Reduzido 60%",
  reduzido_zero: "Alíquota Zero",
  padrao: "Padrão",
}

const REGIME_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  diferenciado_60: "secondary",
  reduzido_zero: "default",
  padrao: "outline",
}

function regimeBadgeClass(regimeType: string): string {
  const v = REGIME_VARIANT[regimeType] ?? "outline"
  if (v === "outline" || v === "secondary") return "font-normal text-muted-foreground"
  return "font-normal"
}

/**
 * Acento de status da linha: borda fina (1px) — não mais o `border-l-4`
 * "side-tab" detectado pelo scanner determinístico. A cor continua a
 * acompanhar o selo de Elegibilidade e o Sinal (nunca é o único canal).
 */
export function expenseRowAccentBorderClass(
  hasErr: boolean,
  hasClassification: boolean,
  noRagEvidence: boolean,
  isEligible: boolean,
  hasLeak: boolean,
): string {
  if (hasErr || !hasClassification || noRagEvidence) {
    return "border-l-slate-400/70 dark:border-l-slate-500/70"
  }
  if (isEligible && !hasLeak) {
    return "border-l-emerald-500/70 dark:border-l-emerald-400/70"
  }
  return "border-l-amber-500/70 dark:border-l-amber-400/70"
}

export function ExpenseEligibilityBadge({
  hasErr,
  errMsg,
  c,
  eff,
}: {
  hasErr: boolean
  errMsg?: string
  c: ClassificationItem | null
  eff: EffectiveSimulationFields | null
}) {
  if (hasErr) {
    return (
      <Badge variant="outline" title={errMsg}>
        Erro na classificação
      </Badge>
    )
  }
  if (c && eff) {
    return (
      <Badge variant={eff.is_eligible ? "default" : "destructive"}>
        {eff.is_eligible ? "Elegível" : "Não Elegível"}
      </Badge>
    )
  }
  return <Badge variant="outline">—</Badge>
}

export function ExpenseRegimeBadge({
  hasErr,
  c,
  eff,
}: {
  hasErr: boolean
  c: ClassificationItem | null
  eff: EffectiveSimulationFields | null
}) {
  if (hasErr || !c || !eff) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <Badge variant={REGIME_VARIANT[eff.regime_type] ?? "outline"} className={regimeBadgeClass(eff.regime_type)}>
      {REGIME_LABEL[eff.regime_type] ?? "Padrão"}
    </Badge>
  )
}

export function ExpenseRiskBadge({ hasErr, c }: { hasErr: boolean; c: ClassificationItem | null }) {
  if (hasErr || !c) return <span className="text-xs text-muted-foreground">—</span>
  const key = c.risk_level?.trim() ?? ""
  if (!key || !(key in RISK_LABEL)) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <Badge variant="outline" className={cn("font-normal", RISK_BADGE_CLASS[key])}>
      {RISK_LABEL[key]}
    </Badge>
  )
}

export function ExpenseSignalCell({ hasErr, c }: { hasErr: boolean; c: ClassificationItem | null }) {
  if (hasErr) return <span className="text-xs text-muted-foreground">—</span>
  return <ExpenseConfidenceSignal score={c?.confidence} hasConsultantOverride={c ? hasConsultantOverride(c) : false} />
}
