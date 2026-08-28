import Decimal from "decimal.js"
import { formatBRL } from "@/lib/format-money"
import { parseApiDecimal } from "@/lib/money-decimal"
import { cn } from "@/lib/utils"
import type { ReportSection, ReportSectionProps } from "@/lib/report-contract"
import type { CreditLeak } from "@/types/api"

function sumAnnualValues(leak: CreditLeak): Decimal {
  if (!leak.annual_values?.length) {
    // Registo pré-PR5 (achado 10): sem annual_values, o único valor
    // conhecido é o do ano simulado — não fabricar uma série.
    return parseApiDecimal(leak.lost_credit) ?? new Decimal(0)
  }
  return leak.annual_values.reduce((acc, av) => {
    const d = parseApiDecimal(av.lost_credit)
    return d ? acc.add(d) : acc
  }, new Decimal(0))
}

const PRIORITY_LABEL: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" }
const PRIORITY_BADGE_CLASS: Record<string, string> = {
  alta: "border-red-500/45 bg-red-500/10 text-red-950 dark:text-red-200",
  media: "border-amber-500/50 bg-amber-500/12 text-amber-950 dark:text-amber-100",
  baixa: "border-border bg-muted/40 text-muted-foreground",
}

function PriorityBadge({ priority }: { priority?: string }) {
  const key = priority?.trim() ?? ""
  if (!key || !(key in PRIORITY_LABEL)) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        PRIORITY_BADGE_CLASS[key],
      )}
    >
      {PRIORITY_LABEL[key]}
    </span>
  )
}

const EFFORT_RISK_LABEL: Record<string, string> = { baixo: "baixo", medio: "médio", alto: "alto" }

function effortRiskText(effort?: string, risk?: string) {
  const e = effort?.trim()
  const r = risk?.trim()
  if (!e && !r) return "—"
  const eLabel = e && e in EFFORT_RISK_LABEL ? EFFORT_RISK_LABEL[e] : "—"
  const rLabel = r && r in EFFORT_RISK_LABEL ? EFFORT_RISK_LABEL[r] : "—"
  return `${eLabel} · ${rLabel}`
}

function PlanoDeAcaoHeader({ id }: { id: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5 print:mb-3">
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted font-mono text-[10px] font-semibold tabular-nums text-muted-foreground board-ready:hidden"
      >
        5
      </span>
      <h2
        id={id}
        className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground board-ready:font-board-report board-ready:text-lg board-ready:normal-case board-ready:tracking-normal board-ready:font-semibold board-ready:text-foreground"
      >
        Plano de ação
      </h2>
    </div>
  )
}

function PlanoDeAcaoSection({ record }: ReportSectionProps) {
  const leaks = record.simulation.credit_leaks ?? []
  if (leaks.length === 0) return null

  const ordered = [...leaks].sort((a, b) => sumAnnualValues(b).minus(sumAnnualValues(a)).toNumber())
  const total = leaks.reduce((acc, l) => {
    const d = parseApiDecimal(l.lost_credit)
    return d ? acc.add(d) : acc
  }, new Decimal(0))

  return (
    <section
      id="tribia-plano-de-acao"
      aria-labelledby="tribia-section-plano-de-acao-title"
      className={cn(
        "scroll-mt-36 rounded-xl border border-border/60 bg-card/90 break-inside-avoid print:border-foreground/20 print:bg-transparent",
        "print:mt-6 print:break-before-page print:pt-0",
      )}
    >
      <div className="p-5 sm:p-6 print:p-0">
        <PlanoDeAcaoHeader id="tribia-section-plano-de-acao-title" />
        <p className="text-xs leading-relaxed text-foreground print:hidden">
          Em CBS/IBS com não-cumulatividade plena no modelo, fornecedores e insumos elegíveis geram{" "}
          <span className="font-medium">custo recuperável</span> (crédito); as despesas abaixo estão marcadas
          inelegíveis e representam <span className="font-medium">custo morto</span> até revisar nexo e
          documentação. Ordenado pelo valor acumulado ao longo da transição 2026–2033 — não substitui assessoria.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border print:mt-3 print:overflow-visible print:rounded-none print:border-foreground/20">
          <table className="w-full border-collapse text-xs print:text-[10px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left print:border-foreground/30 print:bg-transparent">
                <th className="px-3 py-2 font-semibold text-foreground">Ação</th>
                <th className="px-3 py-2 font-semibold text-foreground">Prioridade</th>
                <th className="px-3 py-2 font-semibold text-foreground">Esforço · Risco</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">Valor perdido</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((leak, index) => {
                const legalBase = leak.legal_base?.trim()
                const reason = leak.reason?.trim()
                const fix = leak.fix?.trim()
                return (
                  <tr key={`${leak.description}-${index}`} className="border-b border-border/60 align-top last:border-b-0 print:border-foreground/10">
                    <td className="max-w-xs px-3 py-2.5">
                      <p className="font-medium text-foreground">{leak.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground print:text-foreground/70">
                        {legalBase || "Sem citação — revisar com o fiscal antes de agir"}
                      </p>
                      {(reason || fix) && (
                        <p className="mt-1 text-[11px] leading-snug text-muted-foreground print:text-foreground/70">
                          {reason && <span>{reason}</span>}
                          {reason && fix && " → "}
                          {fix && <span className="text-emerald-700 dark:text-emerald-400">{fix}</span>}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <PriorityBadge priority={leak.priority} />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{effortRiskText(leak.effort, leak.risk)}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-red-700 dark:text-red-400">
                      −{formatBRL(leak.lost_credit)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/20 bg-muted/20 print:bg-transparent">
                <td className="px-3 py-2.5 font-semibold text-foreground" colSpan={3}>
                  Total recuperável (ano simulado)
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-red-700 dark:text-red-400">
                  −{formatBRL(total.toFixed(2))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  )
}

export const planoDeAcaoSection: ReportSection = {
  id: "plano-de-acao",
  title: "Plano de ação",
  print: "always",
  screenTab: "cronograma",
  Component: PlanoDeAcaoSection,
}
