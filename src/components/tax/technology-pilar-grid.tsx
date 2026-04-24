import { CheckCircle, Scale, TrendingDown, Zap } from "lucide-react"

const pilares = [
  {
    icon: Scale,
    title: "Conformidade e Segurança de Auditoria",
    body: "Classifique créditos sem medo de autuações. O motor RAG busca semanticamente na lei exata e fornece a justificativa legal rastreável na LC 68/2024 para cada item simulado.",
  },
  {
    icon: Zap,
    title: "Precisão Financeira Decimal",
    body: (
      <>
        Elimine erros de arredondamento custosos (erros{" "}
        <code className="rounded border border-border/60 bg-muted/50 px-1 font-mono text-[0.7rem]">float64</code>
        ). Nosso motor em Go utiliza precisão decimal monetária (
        <code className="rounded border border-border/60 bg-muted/50 px-1 font-mono text-[0.7rem]">
          shopspring/decimal
        </code>
        ) para o cálculo final.
      </>
    ),
  },
  {
    icon: TrendingDown,
    title: "Projeção de Fluxo de Caixa 2026-2033",
    body: "Mapeie estrategicamente o impacto futuro no caixa hoje. Simule qualquer ano da transição e gerencie o delta entre o regime atual e a rampa CBS/IBS.",
  },
] as const

/**
 * Três pilares de valor (CFO / risco / caixa) — copy estratégica, não catalogação de stack.
 */
export function TechnologyPilarGrid() {
  return (
    <section className="border-b py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Valor para o negócio
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            O que o TribIA destrava
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm text-muted-foreground">
            Foco em risco, numerário e horizonte de transição — além de elegância de implementação.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {pilares.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-border/80 bg-background p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10">
                <p.icon className="h-5 w-5 text-emerald-600" aria-hidden />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Fundamento e rastreio
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
