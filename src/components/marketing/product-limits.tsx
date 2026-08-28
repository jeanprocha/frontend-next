const LIMITES = [
  "Modela empresas de serviços. Imposto Seletivo, IPI e ICMS estão fora, assim como a tributação de mercadorias.",
  "A alíquota de referência de 26,5% é projeção do Ministério da Fazenda e do TCU — não está fixada em lei. Cada linha do documento marca essa origem.",
  "MEI e Simples Nacional usam parâmetros ilustrativos, declarados como tais no próprio parecer.",
  "Não substitui parecer jurídico-contábil. O profissional que assina responde pela tese perante o cliente.",
] as const

export function ProductLimits() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6 flex flex-wrap items-baseline gap-4">
        <span className="font-mono text-xs font-medium tracking-[0.12em] text-accent uppercase">
          08 · Limites
        </span>
        <h2 className="font-board-report text-[28px] leading-tight font-semibold tracking-tight text-foreground">
          O que este produto não faz
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LIMITES.map((texto) => (
          <p
            key={texto}
            className="border-l-2 border-border py-1 pl-4 text-[15px] leading-relaxed text-foreground"
          >
            {texto}
          </p>
        ))}
      </div>
    </section>
  )
}
