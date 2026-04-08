"use client"

import {
  ArrowRight,
  BrainCircuit,
  Info,
  MessageSquareText,
  ReceiptText,
  Scale,
  Sparkles,
  Zap,
} from "lucide-react"
import { ConfidenceGauge } from "@/components/tax/confidence-gauge"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { modKeyLabel, SHORTCUT_KEYS } from "@/constants/shortcuts"
import { cn } from "@/lib/utils"
import { TermTooltip } from "@/components/tax/term-tooltip"

interface ResultSidebarProps {
  year: number
  totalReceita: number
  totalDespesas: number
  validServicesCount: number
  validExpensesCount: number
  loading: boolean
  canSubmit: boolean
  /** Sem serviços válidos: modo onboarding (pipeline + tease do gráfico). */
  educationalMode?: boolean
}

/** Um único Intl para BRL: hero (sem símbolo no bloco grande) e linhas do corpo ficam alinhados. */
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

function formatBRL(n: number): string {
  return BRL.format(n)
}

/** Parte numérica (vírgula decimal, milhares), sem símbolo — mesmo motor que `formatBRL`. */
function formatBRLWithoutSymbol(n: number): string {
  return BRL.formatToParts(n)
    .filter((p) => p.type !== "currency")
    .map((p) => p.value)
    .join("")
    .trimStart()
}

const PIPELINE_STEPS = [
  {
    title: "Contexto",
    hint: "Regime e descrição da empresa",
    Icon: MessageSquareText,
  },
  {
    title: "Classificação",
    hint: "IA consulta a LC 68/2024 via RAG",
    Icon: BrainCircuit,
  },
  {
    title: "Veredito",
    hint: "Impacto e transição 2026–2033",
    Icon: Scale,
  },
] as const

function TransitionChartTeaser() {
  const bars = [28, 42, 36, 55, 48, 62, 50, 58]
  return (
    <div className="relative mt-1 h-28 overflow-hidden rounded-xl border border-border/60 bg-muted/20">
      <div
        className="absolute inset-0 flex items-end justify-around gap-1 px-3 pb-2 pt-6 opacity-70 blur-[5px] motion-reduce:blur-none motion-reduce:opacity-50"
        aria-hidden
      >
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-2 rounded-t-sm bg-emerald-500/80 dark:bg-emerald-400/70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-background/95 via-background/55 to-transparent px-3 pb-3 pt-8">
        <p className="text-center text-xs font-medium leading-snug text-muted-foreground">
          Simule para visualizar o impacto projetado{" "}
          <span className="whitespace-nowrap tabular-nums text-foreground/90">2026–2033</span>.
        </p>
      </div>
    </div>
  )
}

export function ResultSidebar({
  year,
  totalReceita,
  totalDespesas,
  validServicesCount,
  validExpensesCount,
  loading,
  canSubmit,
  educationalMode = false,
}: ResultSidebarProps) {
  const showHeroAmount = !loading && totalReceita > 0
  const showEducational = educationalMode && !loading

  return (
    <aside className="group/sidebar relative sticky top-[4.5rem] overflow-visible pb-1">
      {/* Glow atrás do card: blur só aqui; conteúdo permanece nítido em z-10 */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-4 z-0 rounded-[2.5rem] bg-emerald-500/11 blur-[32px] transition-all duration-1000",
          "dark:bg-emerald-500/9",
          "group-hover/sidebar:bg-emerald-500/18 group-hover/sidebar:blur-[52px]",
          "dark:group-hover/sidebar:bg-emerald-500/14 dark:group-hover/sidebar:blur-[52px]",
          loading
            ? "motion-safe:animate-soft-pulse motion-reduce:animate-none motion-reduce:opacity-[0.22]"
            : "opacity-40 motion-reduce:opacity-35",
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-[2rem] border border-border/60 bg-white shadow-2xl shadow-slate-200/40 backdrop-blur-md transition-all",
          "dark:border-border/60 dark:bg-slate-950/40 dark:shadow-black/40",
        )}
      >
        {/* Header impacto */}
        <div className="relative overflow-hidden bg-tribia-navy-hero p-6 text-white">
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.14]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-0 right-0 z-[1] h-32 w-32 bg-emerald-500/11 blur-[32px] dark:bg-emerald-500/8"
            aria-hidden
          />
          <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Resultado projetado
            </span>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1">
              <span className="text-xs font-bold uppercase tracking-tighter text-emerald-400">
                {showEducational ? "Pipeline" : "Análise ativa"}
              </span>
              {!showEducational && (
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full bg-emerald-500",
                    "motion-safe:animate-ping motion-reduce:animate-none",
                  )}
                  aria-hidden
                />
              )}
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-medium text-slate-500">R$</span>
            <span className="text-4xl font-black tracking-tighter tabular-nums text-white sm:text-5xl">
              {loading ? "—" : showHeroAmount ? formatBRLWithoutSymbol(totalReceita) : "—"}
            </span>
          </div>
          <p className="relative z-10 mt-1 text-sm font-medium uppercase tracking-widest text-slate-400">
            Receita declarada no formulário
          </p>

          <div className="relative z-10 mt-3 border-b border-white/10 pb-2">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Ano base {year} ·{" "}
              <TermTooltip term="CBS" triggerClassName="border-slate-500/60 text-slate-300" />
              {" / "}
              <TermTooltip term="IBS" triggerClassName="border-slate-500/60 text-slate-300" />
            </span>
          </div>
        </div>

        {/* Corpo glass */}
        <div className="space-y-5 border-t border-border bg-white/90 p-6 dark:border-border dark:bg-slate-900/50">
          {showEducational ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Como o TribIA processa seu cenário
              </p>
              <ol className="space-y-3">
                {PIPELINE_STEPS.map(({ title, hint, Icon }, i) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30 text-xs font-bold tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <Icon className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        <span className="text-xs font-semibold text-foreground">{title}</span>
                      </div>
                      <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{hint}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pré-visualização
                </p>
                <TransitionChartTeaser />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Preencha ao menos uma receita válida e simule para ver números, gráficos e créditos com evidências na LC 68/2024.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <ReceiptText className="size-4 shrink-0 text-slate-400" aria-hidden />
                    Receita bruta
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {totalReceita > 0 ? formatBRL(totalReceita) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Zap className="size-4 shrink-0 text-slate-400" aria-hidden />
                    Despesas informadas
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {totalDespesas > 0 ? formatBRL(totalDespesas) : "—"}
                  </span>
                </div>
                <Separator className="bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>Configuração atual</span>
                  <span className="tabular-nums text-slate-700 dark:text-slate-300">
                    {validServicesCount} serv. · {validExpensesCount} desp.
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/25">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
                      <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold uppercase tracking-tight text-emerald-900 dark:text-emerald-200">
                        Inteligência de crédito
                      </p>
                      <p className="text-xs leading-relaxed text-emerald-900/75 dark:text-emerald-100/70">
                        A IA classifica cada despesa consultando a LC 68/2024 via RAG antes de calcular o impacto.
                      </p>
                    </div>
                  </div>
                  {loading && (
                    <div className="flex shrink-0 justify-center sm:justify-end">
                      <ConfidenceGauge
                        indeterminate
                        className="scale-[0.92] border-emerald-200/50 bg-white/70 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/50"
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs leading-tight text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
            <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
            <p>
              Os cálculos consideram o regime de{" "}
              <TermTooltip term="Split Payment">Split Payment</TermTooltip> e alíquotas estimadas para o período de
              transição ({year}).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className={cn(
              "group/cta flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold tracking-tight transition-all duration-200",
              "bg-slate-900 text-white shadow-lg shadow-slate-900/15 hover:bg-emerald-600",
              "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Classificando e calculando…
              </span>
            ) : (
              <>
                <span>Simular impacto tributário</span>
                <span className="hidden items-center gap-1 opacity-90 sm:inline-flex">
                  <Kbd>{modKeyLabel()}</Kbd>
                  <Kbd>{SHORTCUT_KEYS.simulateSubmit}</Kbd>
                </span>
                <ArrowRight className="size-5 transition-transform group-hover/cta:translate-x-1" aria-hidden />
              </>
            )}
          </button>

          {!canSubmit && (
            <p className="text-center text-sm text-muted-foreground">
              Adicione ao menos um serviço para simular
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
