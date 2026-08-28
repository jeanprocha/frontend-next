import Link from "next/link"
import { ArrowRight, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ROTAS } from "@/constants/routes"

/**
 * Dobra 1 — "o dossiê é a página" (docs/product/04-landing.md §2/§3).
 *
 * O entregável ocupa a dobra em escala e é cortado por ela; a coluna
 * esquerda carrega a tese, o CTA e três anotações ancoradas ao documento.
 * Conteúdo do cartão à direita é ILUSTRATIVO — rotulado como tal — porque
 * /exemplo (o dossiê real) depende de um registro curado em produção
 * (M-U3, ainda não publicado). Reproduzido com as classes reais do dossiê
 * (FinancialVerdictHeroCard, base-legal-selo, factors-table) para não
 * divergir visualmente do produto quando /exemplo estiver pronto.
 */
export function DocumentHero() {
  return (
    <section className="relative overflow-hidden border-b bg-tribia-canvas">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 lg:grid-cols-[392px_1fr] lg:gap-11 lg:py-14">
        {/* Coluna de texto */}
        <div className="flex flex-col">
          <span className="font-mono text-xs font-medium tracking-[0.12em] text-accent uppercase">
            Diagnóstico da reforma tributária
          </span>

          <h1 className="font-board-report mt-3 text-4xl leading-[1.1] font-semibold tracking-tight text-foreground text-balance sm:text-5xl">
            Um parecer, não uma estimativa.
          </h1>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">
            O TribIA classifica cada despesa quanto ao direito a crédito de
            CBS/IBS citando o artigo da LC 214/2025, calcula a carga de 2026 a
            2033 num motor determinístico e entrega um documento que o seu
            cliente lê sozinho.
          </p>

          <div className="mt-7 flex flex-col items-start gap-2.5">
            <Link
              href={ROTAS.exemplo}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
            >
              Abrir este dossiê
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <span className="text-xs text-muted-foreground">
              Dossiê real, dados ilustrativos. Sem login.
            </span>
          </div>

          {/* Anotações ancoradas ao documento */}
          <dl className="mt-10 divide-y divide-border/80 border-t border-border/80">
            {[
              "o selo carrega a data-base do corpus, vinda do servidor",
              "o veredito sai do motor determinístico — a IA não toca no número",
              "a conta abre passo a passo, com a origem de cada regra",
            ].map((nota, i) => (
              <div key={nota} className="flex items-start gap-3 py-3.5">
                <dt className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</dt>
                <dd className="font-mono text-xs leading-relaxed text-muted-foreground">{nota}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* O documento, cortado pela dobra — wrapper e card com a MESMA altura fixa
            por breakpoint, senão a legenda (ancorada a bottom:0 do wrapper) corta
            o card num ponto diferente do fim visível dele. */}
        <div className="relative h-[420px] sm:h-[560px] lg:h-[620px]">
          <div className="absolute inset-x-0 top-0 h-full overflow-hidden rounded-t-xl border border-b-0 border-border tribia-shadow-elevated bg-card">
            <div className="px-6 pt-7 sm:px-8 sm:pt-8">
              {/* Masthead */}
              <div className="font-board-report flex flex-col gap-1.5 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">TribIA · Dossiê de diagnóstico</p>
                  <p className="font-sans text-xs text-muted-foreground">
                    Simulação processada pelo motor determinístico
                  </p>
                </div>
                <p className="font-mono text-xs text-muted-foreground sm:whitespace-nowrap">Gerado em 28/08/2026</p>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-3 py-4">
                <div>
                  <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Empresa</p>
                  <p className="text-sm font-medium text-foreground">Northwind Serviços de TI</p>
                </div>
                <div>
                  <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Cenário</p>
                  <p className="text-sm font-medium text-foreground">Simulação base · 2027 · regime regular</p>
                </div>
              </div>

              <p
                role="note"
                className="flex w-fit items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[13px] text-emerald-800 dark:text-emerald-300"
              >
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
                Base legal <span className="font-medium">LC 214/2025</span> atualizada em{" "}
                <span className="font-medium">16/01/2026</span>
              </p>

              {/* Veredito */}
              <div className="mt-5 rounded-xl border border-red-700/20 bg-red-500/[0.025] p-6 dark:border-red-700/30 dark:bg-red-950/10">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      Veredito financeiro
                    </p>
                    <p className="font-sans text-4xl font-bold tracking-tight tabular-nums text-red-900 sm:text-5xl dark:text-red-400">
                      + R$ 18.430,00
                    </p>
                    <p className="text-sm text-muted-foreground">
                      12,4% sobre a carga líquida atual estimada
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="verdictIncrease" className="gap-1 px-2 py-0.5 text-xs font-semibold">
                      <ShieldAlert className="size-3 shrink-0" aria-hidden />
                      Carga adicional projetada
                    </Badge>
                    <p className="text-right text-[10px] font-medium text-muted-foreground/80">
                      Motor Go · LC 214/2025
                    </p>
                  </div>
                </div>
              </div>

              {/* Memória de cálculo, cortada pela dobra */}
              <div className="mt-6">
                <p className="font-board-report border-b border-border pb-2.5 text-lg font-semibold text-foreground">
                  Memória de cálculo — 2027
                </p>
                <table className="w-full border-collapse text-left text-sm">
                  <tbody className="tabular-nums">
                    <tr className="border-b border-border/60">
                      <td className="py-2.5 pr-2 text-foreground">Receita — consultoria de software</td>
                      <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">120.000,00 × 8,70% (CBS)</td>
                      <td className="py-2.5 text-right font-mono">10.440,00</td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <td className="py-2.5 pr-2 text-foreground">Receita — consultoria de software</td>
                      <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">120.000,00 × 0,10% (IBS)</td>
                      <td className="py-2.5 text-right font-mono">120,00</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-2 text-foreground">Crédito — infraestrutura em nuvem</td>
                      <td className="py-2.5 pr-2 font-mono text-xs text-muted-foreground">4.000,00 × 8,80%</td>
                      <td className="py-2.5 text-right font-mono">352,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Legenda de honestidade, sobre a dobra */}
          <div className="absolute right-7 bottom-0 left-0 bg-gradient-to-t from-tribia-canvas via-tribia-canvas/90 to-transparent px-1 pt-8 pb-2">
            <p className="font-mono text-[11px] text-muted-foreground">dossiê do produto · dados ilustrativos</p>
          </div>
        </div>
      </div>
    </section>
  )
}
