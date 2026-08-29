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

const RECOVERABLE_VALUE_CLASS = "font-mono tabular-nums text-emerald-700 dark:text-emerald-400"

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

interface OrderedLeak {
  leak: CreditLeak
  recoverable: Decimal
}

/** Base legal + motivo→correção de uma linha — a descrição fica com o chamador
 *  (a tabela e o cartão mobile a posicionam de formas diferentes). */
function LeakDetails({ leak }: { leak: CreditLeak }) {
  const legalBase = leak.legal_base?.trim()
  const reason = leak.reason?.trim()
  const fix = leak.fix?.trim()
  return (
    <>
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
    </>
  )
}

function PlanoDeAcaoSection({ record }: ReportSectionProps) {
  const leaks = record.simulation.credit_leaks ?? []
  if (leaks.length === 0) return null

  // Convenção da seção: a métrica exibida É a métrica que ordena. Com a série
  // completa, é o acumulado 2026–2033; registros pré-PR5 (sem annual_values)
  // caem para o valor do ano simulado — e o cabeçalho da coluna declara qual é.
  const hasFullSeries = leaks.every((l) => l.annual_values?.length)
  const ordered: OrderedLeak[] = [...leaks]
    .map((leak) => ({ leak, recoverable: sumAnnualValues(leak) }))
    .sort((a, b) => b.recoverable.minus(a.recoverable).toNumber())
  const total = ordered.reduce((acc, o) => acc.add(o.recoverable), new Decimal(0))
  const valueHeader = hasFullSeries
    ? "Crédito recuperável 2026–2033"
    : "Crédito recuperável (ano simulado)"

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
        <p className="text-xs leading-relaxed text-foreground print:text-[10px]">
          Em CBS/IBS com não-cumulatividade plena no modelo, fornecedores e insumos elegíveis geram{" "}
          <span className="font-medium">custo recuperável</span> (crédito); as despesas abaixo estão marcadas
          inelegíveis e são <span className="font-medium">custo morto</span> até revisar nexo e documentação.
          A ordem segue a última coluna — da maior para a menor oportunidade. Não substitui assessoria.
        </p>

        {/* Tabela: telas ≥ sm e impressão. No celular, o gêmeo em cartões abaixo
            assume — nada de rolagem horizontal escondendo a coluna de R$. */}
        <div className="mt-4 hidden overflow-x-auto rounded-lg border border-border sm:block print:mt-3 print:block print:overflow-visible print:rounded-none print:border-foreground/20">
          <table className="w-full border-collapse text-xs print:text-[10px]">
            <caption className="sr-only">
              Plano de ação — despesas inelegíveis ordenadas pelo crédito recuperável, da maior para a menor oportunidade
            </caption>
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left print:border-foreground/30 print:bg-transparent">
                <th className="px-3 py-2 font-semibold text-foreground">Ordem</th>
                <th className="px-3 py-2 font-semibold text-foreground">Ação</th>
                <th className="px-3 py-2 font-semibold text-foreground">Prioridade</th>
                <th className="px-3 py-2 font-semibold text-foreground">Esforço · Risco</th>
                <th className="px-3 py-2 text-right font-semibold text-foreground">{valueHeader}</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map(({ leak, recoverable }, index) => (
                <tr
                  key={`${leak.description}-${index}`}
                  className={cn(
                    "border-b border-border/60 align-top last:border-b-0 print:border-foreground/10",
                    index === 0 && "bg-emerald-500/5 dark:bg-emerald-500/10 print:bg-transparent",
                  )}
                >
                  <td
                    className={cn(
                      "px-3 py-2.5 font-mono text-sm font-semibold tabular-nums",
                      index === 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </td>
                  <td className="max-w-xs px-3 py-2.5">
                    <p className="font-medium text-foreground">{leak.description}</p>
                    <LeakDetails leak={leak} />
                  </td>
                  <td className="px-3 py-2.5">
                    <PriorityBadge priority={leak.priority} />
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{effortRiskText(leak.effort, leak.risk)}</td>
                  <td className={cn("px-3 py-2.5 text-right", RECOVERABLE_VALUE_CLASS)}>
                    +{formatBRL(recoverable.toFixed(2))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-foreground/20 bg-muted/20 print:bg-transparent">
                <td className="px-3 py-2.5 font-semibold text-foreground" colSpan={4}>
                  Total recuperável se documentado
                </td>
                <td className={cn("px-3 py-2.5 text-right text-sm font-semibold", RECOVERABLE_VALUE_CLASS)}>
                  +{formatBRL(total.toFixed(2))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Gêmeo mobile: um cartão por linha, valor sempre na tela. */}
        <ul className="mt-4 flex list-none flex-col gap-2.5 p-0 sm:hidden print:hidden">
          {ordered.map(({ leak, recoverable }, index) => (
            <li
              key={`${leak.description}-${index}`}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border p-3",
                index === 0 && "bg-emerald-500/5 dark:bg-emerald-500/10",
              )}
            >
              <span
                className={cn(
                  "font-mono text-base font-semibold tabular-nums",
                  index === 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium text-foreground">{leak.description}</p>
                  <span className={cn("shrink-0 text-sm", RECOVERABLE_VALUE_CLASS)}>
                    +{formatBRL(recoverable.toFixed(2))}
                  </span>
                </div>
                <LeakDetails leak={leak} />
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <PriorityBadge priority={leak.priority} />
                  <span>{effortRiskText(leak.effort, leak.risk)}</span>
                </div>
              </div>
            </li>
          ))}
          <li className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3 text-xs">
            <span className="font-semibold text-foreground">Total recuperável se documentado</span>
            <span className={cn("text-sm font-semibold", RECOVERABLE_VALUE_CLASS)}>
              +{formatBRL(total.toFixed(2))}
            </span>
          </li>
        </ul>
      </div>
    </section>
  )
}

export const planoDeAcaoSection: ReportSection = {
  id: "plano-de-acao",
  title: "Plano de ação",
  print: "always",
  screenTab: "veredito",
  Component: PlanoDeAcaoSection,
}
