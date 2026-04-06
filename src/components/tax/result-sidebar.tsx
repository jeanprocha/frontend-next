"use client"

import { ArrowRight, Info, ReceiptText, Sparkles, Zap } from "lucide-react"
import { ConfidenceGauge } from "@/components/tax/confidence-gauge"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { modKeyLabel } from "@/lib/platform"
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
}

function formatAmountNoSymbol(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ResultSidebar({
  year,
  totalReceita,
  totalDespesas,
  validServicesCount,
  validExpensesCount,
  loading,
  canSubmit,
}: ResultSidebarProps) {
  const showHeroAmount = !loading && totalReceita > 0

  return (
    <aside className="group/sidebar relative sticky top-[4.5rem] overflow-visible pb-1">
      {/* Glow atrás do card: blur só aqui; conteúdo permanece nítido em z-10 */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-4 z-0 rounded-[2.5rem] bg-emerald-500/15 blur-[40px] transition-all duration-1000",
          "dark:bg-emerald-500/12",
          "group-hover/sidebar:bg-emerald-500/25 group-hover/sidebar:blur-[60px]",
          "dark:group-hover/sidebar:bg-emerald-500/18 dark:group-hover/sidebar:blur-[60px]",
          loading
            ? "motion-safe:animate-soft-pulse motion-reduce:animate-none motion-reduce:opacity-[0.22]"
            : "opacity-40 motion-reduce:opacity-35",
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-2xl shadow-slate-200/40 backdrop-blur-md transition-all",
          "dark:border-slate-700/60 dark:bg-slate-950/40 dark:shadow-black/40",
        )}
      >
        {/* Header impacto */}
        <div className="relative overflow-hidden bg-slate-950 p-6 text-white">
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.14]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-0 right-0 z-[1] h-32 w-32 bg-emerald-500/15 blur-[40px] dark:bg-emerald-500/10"
            aria-hidden
          />
          <div className="relative z-10 mb-4 flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Resultado projetado
            </span>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-400">
                Análise ativa
              </span>
              {/* Ping só com motion permitido; reduce motion = ponto estático (menos distração que ping). */}
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full bg-emerald-500",
                  "motion-safe:animate-ping motion-reduce:animate-none",
                )}
                aria-hidden
              />
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-medium text-slate-500">R$</span>
            <span className="text-4xl font-black tracking-tighter tabular-nums text-white sm:text-5xl">
              {loading ? "—" : showHeroAmount ? formatAmountNoSymbol(totalReceita) : "—"}
            </span>
          </div>
          <p className="relative z-10 mt-1 text-[11px] font-medium uppercase tracking-widest text-slate-400">
            Receita declarada no formulário
          </p>

          <div className="relative z-10 mt-3 border-b border-slate-800 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Ano base {year} ·{" "}
              <TermTooltip term="CBS" triggerClassName="border-slate-500/60 text-slate-300" />
              {" / "}
              <TermTooltip term="IBS" triggerClassName="border-slate-500/60 text-slate-300" />
            </span>
          </div>
        </div>

        {/* Corpo glass */}
        <div className="space-y-5 border-t border-slate-800/40 bg-white/90 p-6 dark:border-slate-700/50 dark:bg-slate-900/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <ReceiptText className="size-4 shrink-0 text-slate-400" aria-hidden />
                Receita bruta
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {totalReceita > 0
                  ? totalReceita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Zap className="size-4 shrink-0 text-slate-400" aria-hidden />
                Despesas informadas
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {totalDespesas > 0
                  ? totalDespesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : "—"}
              </span>
            </div>
            <Separator className="bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                  <p className="text-[11px] font-semibold uppercase tracking-tight text-emerald-900 dark:text-emerald-200">
                    Inteligência de crédito
                  </p>
                  <p className="text-[12px] leading-relaxed text-emerald-900/75 dark:text-emerald-100/70">
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

          <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[10px] leading-tight text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
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
                <Kbd className="hidden opacity-90 sm:inline-flex">{modKeyLabel()}+Enter</Kbd>
                <ArrowRight className="size-5 transition-transform group-hover/cta:translate-x-1" aria-hidden />
              </>
            )}
          </button>

          {!canSubmit && (
            <p className="text-center text-[11px] text-muted-foreground">
              Adicione ao menos um serviço para simular
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
