const STEPS = [
  { n: "01", title: "Despesas", body: "Um CSV do cliente ou o formulário, com o contexto da empresa." },
  { n: "02", title: "Classificação", body: "Busca no texto da lei e modelo de linguagem, com evidência por linha." },
  { n: "03", title: "Cálculo", body: "Motor determinístico, ano a ano de 2026 a 2033, sem opinião no lugar da conta." },
  { n: "04", title: "Dossiê", body: "Link público para o cliente abrir, ou impressão com a conta inteira." },
] as const

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="flex flex-wrap items-baseline gap-4">
        <span className="font-mono text-xs font-medium tracking-[0.12em] text-accent uppercase">
          06 · O processo
        </span>
        <h2 className="font-board-report text-[28px] leading-tight font-semibold tracking-tight text-foreground">
          Como o documento é produzido
        </h2>
        <span className="ml-auto font-mono text-[13px] text-muted-foreground">
          IA explica; o cálculo é determinístico.
        </span>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-xl border border-border bg-card p-5">
            <span className="font-mono text-xs text-accent">{s.n}</span>
            <p className="mt-2 text-[17px] font-semibold text-foreground">{s.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
