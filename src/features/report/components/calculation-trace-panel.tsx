import { formatBRL } from "@/lib/format-money"
import { parseApiDecimal } from "@/lib/money-decimal"
import { cn } from "@/lib/utils"
import type { CalculationStep, RuleBasis, TaxBreakdown, TaxComponents } from "@/types/api"

/**
 * Etapa C, W2/PR3 (docs/roadmap-execucao.md 4.1) — o que promove "Memória de
 * cálculo" de um resumo agregado (fatores + líquidos, já existente em
 * FactorsTable/transition-audit-panel-body) para a conta item a item que o
 * aceite do W2 exige: "um contador refaz a conta do PDF usando apenas o
 * documento".
 *
 * Puramente apresentacional — nenhum cálculo acontece aqui, só formatação do
 * que o motor Go já decidiu (trace/components/basis, W2/PR1-2). Usado tanto
 * no painel interativo em tela (transition-audit-panel-body.tsx) quanto no
 * gêmeo sempre-visível na impressão (calculation-trace-print.tsx) — o mesmo
 * componente, dois contextos, sem duplicar a lógica de renderização.
 */

const KIND_LABEL: Record<RuleBasis["kind"], string> = {
  lei_calendario: "Fato do calendário legal",
  estimativa_oficial: "Estimativa oficial (MF/TCU)",
  premissa_tribia: "Premissa TribIA (ilustrativa)",
}

const KIND_BADGE_CLASS: Record<RuleBasis["kind"], string> = {
  lei_calendario: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200",
  estimativa_oficial: "bg-amber-600/15 text-amber-800 dark:text-amber-200",
  premissa_tribia: "bg-muted text-muted-foreground",
}

function ProvenienciaCallout({ basis }: { basis: RuleBasis }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2 text-[11px] leading-snug">
      <span className={cn("mr-2 inline-block rounded px-1.5 py-0.5 font-semibold", KIND_BADGE_CLASS[basis.kind])}>
        {KIND_LABEL[basis.kind]}
      </span>
      <span className="text-muted-foreground">{basis.note}</span>
    </div>
  )
}

/** Só os tributos com valor — MEI/Simples/imobiliário não decompõem (ver TaxComponents no backend). */
function nonZeroComponents(c: TaxComponents | undefined): { label: string; value: string }[] {
  if (!c) return []
  const entries: { label: string; key: keyof TaxComponents }[] = [
    { label: "PIS", key: "pis" },
    { label: "COFINS", key: "cofins" },
    { label: "ISS", key: "iss" },
    { label: "CBS", key: "cbs" },
    { label: "IBS", key: "ibs" },
  ]
  return entries
    .map((e) => ({ label: e.label, value: c[e.key] }))
    .filter((e) => {
      const d = parseApiDecimal(e.value)
      return d != null && !d.isZero()
    })
}

function ComponentsRow({ components }: { components: TaxComponents | undefined }) {
  const rows = nonZeroComponents(components)
  if (rows.length === 0) return null
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
      {rows.map((r) => (
        <span key={r.label} className="font-mono tabular-nums">
          <span className="text-muted-foreground">{r.label}:</span> {formatBRL(r.value)}
        </span>
      ))}
    </div>
  )
}

function StepsTable({ steps }: { steps: CalculationStep[] }) {
  return (
    <table className="w-full border-collapse text-left text-[10.5px] print:text-[9px]">
      <thead>
        <tr className="border-b border-border/60 text-muted-foreground print:border-foreground/30">
          <th className="py-1 pr-2 font-medium">Passo</th>
          <th className="py-1 pr-2 font-medium">Fórmula</th>
          <th className="py-1 font-mono">Resultado</th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {steps.map((step, i) => (
          <tr key={`${step.label}-${i}`} className="border-b border-border/30 align-top print:border-foreground/10">
            <td className="py-1 pr-2">
              <span className="font-medium">{step.label}</span>
              {step.item ? <span className="block text-muted-foreground">{step.item}</span> : null}
            </td>
            <td className="py-1 pr-2 text-muted-foreground">
              {step.formula}
              {step.inputs && step.inputs.length > 0 ? (
                <span className="block font-mono text-[10px] text-muted-foreground/80">
                  {step.inputs.map((inp) => `${inp.name}=${inp.value}`).join("  ×  ")}
                </span>
              ) : null}
            </td>
            <td className="py-1 font-mono">
              {step.output}
              {!step.rounded ? (
                <span className="ml-1 align-top text-[9px] text-muted-foreground" title="Intermediário não arredondado">
                  •
                </span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BreakdownBlock({ label, breakdown }: { label: string; breakdown: TaxBreakdown | undefined }) {
  const steps = breakdown?.trace
  if (!steps || steps.length === 0) return null
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <ComponentsRow components={breakdown.components} />
      <StepsTable steps={steps} />
    </div>
  )
}

export interface CalculationTracePanelProps {
  current?: TaxBreakdown
  projected?: TaxBreakdown
  basis?: RuleBasis
  className?: string
}

/**
 * PRODUCT.md: sem trace não há como fabricar a conta item a item — declara a
 * ausência (registo salvo antes do W2/PR1-2) em vez de renderizar vazio sem
 * explicação, mesmo princípio dos selos de base legal e do motor validado.
 */
export function CalculationTracePanel({ current, projected, basis, className }: CalculationTracePanelProps) {
  const hasTrace = (current?.trace?.length ?? 0) > 0 || (projected?.trace?.length ?? 0) > 0
  if (!hasTrace) {
    return (
      <p className={cn("text-[11px] text-muted-foreground", className)}>
        Memória de cálculo item a item não disponível para este registro — execute e grave uma nova simulação para
        obtê-la.
      </p>
    )
  }
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Memória de cálculo</p>
      {basis ? <ProvenienciaCallout basis={basis} /> : null}
      <BreakdownBlock label="Legado (PIS/COFINS/ISS)" breakdown={current} />
      <BreakdownBlock label="Destino (CBS+IBS)" breakdown={projected} />
    </div>
  )
}
