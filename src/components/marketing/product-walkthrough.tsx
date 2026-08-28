import type { ReactNode } from "react"

/**
 * Seções 2–5 — "rolar é descer pelo documento" (docs/product/04-landing.md §3).
 * Cada seção mostra o artefato real do produto ao lado do texto, nunca só a
 * promessa dele. Conteúdo do lado direito é ilustrativo (ver document-hero.tsx).
 */

function WalkthroughRow({
  index,
  kicker,
  title,
  body,
  footnote,
  children,
}: {
  index: string
  kicker: string
  title: string
  body: string
  footnote?: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-8 border-b border-border/70 py-11 last:border-b-0 lg:grid-cols-[392px_1fr] lg:gap-11">
      <div>
        <span className="font-mono text-xs font-medium tracking-[0.12em] text-accent uppercase">
          {index} · {kicker}
        </span>
        <h2 className="font-board-report mt-3 text-[32px] leading-[1.18] font-semibold tracking-tight text-foreground text-balance">
          {title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">{body}</p>
        {footnote ? <p className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground">{footnote}</p> : null}
      </div>
      <div className="rounded-xl border border-border bg-card p-6 tribia-shadow-elevated sm:p-7">{children}</div>
    </div>
  )
}

const RULE_BASIS: Record<string, string> = {
  lei_calendario: "bg-accent/10 border-accent/25 text-emerald-800 dark:text-emerald-300",
  estimativa_oficial: "bg-muted border-border text-muted-foreground",
  premissa_tribia: "bg-muted border-border text-muted-foreground",
}

function ContaFicaAberta() {
  const linhas = [
    { regra: "PIS/COFINS — fator de manutenção", valor: "0,000000", origem: "fixado em lei · Art. 542", kind: "lei_calendario" },
    { regra: "CBS — alíquota de referência", valor: "0,087000", origem: "estimativa oficial · Art. 347", kind: "estimativa_oficial" },
    { regra: "IBS — alíquota nominal", valor: "0,001000", origem: "fixado em lei · Art. 344", kind: "lei_calendario" },
    { regra: "ISS — fator municipal", valor: "1,000000", origem: "premissa TribIA", kind: "premissa_tribia" },
  ]
  return (
    <>
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <p className="font-board-report text-lg font-semibold text-foreground">Fatores de transição — 2027</p>
        <p className="font-mono text-xs text-muted-foreground">proveniência por linha</p>
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="text-muted-foreground">
            <th className="py-2.5 font-mono text-[11px] font-medium tracking-wide uppercase">Regra</th>
            <th className="py-2.5 pr-6 text-right font-mono text-[11px] font-medium tracking-wide uppercase">Valor</th>
            <th className="py-2.5 font-mono text-[11px] font-medium tracking-wide uppercase">Origem</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {linhas.map((l) => (
            <tr key={l.regra} className="border-t border-border/60">
              <td className="py-2.5 text-foreground">{l.regra}</td>
              <td className="py-2.5 pr-6 text-right font-mono">{l.valor}</td>
              <td className="py-2.5">
                <span className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] ${RULE_BASIS[l.kind]}`}>
                  {l.origem}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function ACitacao() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          Elegível
        </span>
        <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          Risco baixo
        </span>
        <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          Confiança 92% · Sólido
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">Cédula de auditoria</span>
      </div>

      <p className="mt-4 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Instância</p>
      <p className="text-sm text-foreground">Infraestrutura em nuvem — R$ 4.000,00/mês</p>

      <p className="mt-3 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Base legal</p>
      <p className="font-board-report text-lg font-semibold text-foreground">Art. 47, § 1º, inciso II</p>

      <blockquote className="mt-3 rounded-r-lg border-l-2 border-accent bg-muted/40 px-4 py-3">
        <p className="font-board-report text-[15px] leading-relaxed text-foreground">
          &ldquo;O contribuinte sujeito ao regime regular poderá{" "}
          <mark className="rounded bg-accent/25 px-0.5">apropriar créditos do IBS e da CBS</mark>{" "}
          quando ocorrer a extinção dos débitos relativos às operações em que seja adquirente de bens ou serviços
          […]&rdquo;
        </p>
      </blockquote>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-3.5">
        <p className="font-mono text-xs text-muted-foreground">similaridade 0,81 · trecho validado contra o texto</p>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-foreground">
          Abrir no PDF oficial · p. 118
        </span>
      </div>
    </>
  )
}

function ConsultorAssina() {
  return (
    <>
      <p className="font-board-report border-b border-border pb-3 text-lg font-semibold text-foreground">
        Trilha de divergência
      </p>
      <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Sugerido pela IA</p>
          <p className="mt-1.5 text-[15px] font-medium text-muted-foreground line-through decoration-border">
            Não elegível a crédito
          </p>
        </div>
        <div className="rounded-lg border border-accent/25 bg-accent/[0.06] p-4">
          <p className="font-mono text-[11px] tracking-wide text-emerald-800 uppercase dark:text-emerald-300">
            Definido pelo consultor
          </p>
          <p className="mt-1.5 text-[15px] font-semibold text-foreground">Elegível · Padrão</p>
        </div>
      </div>
      <div className="border-t border-border pt-3.5">
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Nota do especialista</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">
          Uso preponderante na atividade econômica comprovado em contrato; documentação anexada ao processo do cliente.
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">registrado em 28/08/2026 · 14:22</p>
      </div>
    </>
  )
}

function TerminaEmAcao() {
  const acoes = [
    { desc: "Documentar uso preponderante — licenças de software", base: "Art. 57, § 3º", prioridade: "Alta", esforco: "Baixo", valor: "24.816,00", prioClass: "bg-accent/10 border-accent/25 text-emerald-800 dark:text-emerald-300" },
    { desc: "Reclassificar — assinaturas de infraestrutura", base: "Art. 47, § 1º", prioridade: "Média", esforco: "Baixo", valor: "9.240,00", prioClass: "bg-muted border-border text-muted-foreground" },
    { desc: "Rever fornecedor do Simples — serviço de suporte", base: "sem citação — revisar com o fiscal", prioridade: "Baixa", esforco: "Alto", valor: "3.168,00", prioClass: "bg-muted border-border text-muted-foreground" },
  ]
  return (
    <>
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <p className="font-board-report text-lg font-semibold text-foreground">Plano de ação</p>
        <p className="font-mono text-xs text-muted-foreground">ordenado pelo valor acumulado 2026–2033</p>
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <tbody className="tabular-nums">
          {acoes.map((a) => (
            <tr key={a.desc} className="border-b border-border/60">
              <td className="py-3 pr-4">
                <p className="text-foreground">{a.desc}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{a.base}</p>
              </td>
              <td className="py-3 pr-4">
                <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${a.prioClass}`}>
                  {a.prioridade}
                </span>
              </td>
              <td className="py-3 pr-4 text-xs text-muted-foreground">{a.esforco}</td>
              <td className="py-3 text-right font-mono">R$ {a.valor}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-foreground/20">
            <td className="py-3 font-board-report text-lg font-semibold text-foreground" colSpan={3}>
              Total recuperável na transição
            </td>
            <td className="py-3 text-right font-mono text-xl font-semibold text-emerald-700 dark:text-emerald-400">
              R$ 37.224,00
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export function ProductWalkthrough() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-2">
      <WalkthroughRow
        index="02"
        kicker="A conta"
        title="A conta fica aberta."
        body="A memória de cálculo mostra cada passo: base, alíquota do ano, fator de transição, crédito item a item e onde o valor foi arredondado. Um contador refaz o número sem abrir a ferramenta."
        footnote="cada regra do ano declara a origem: fixada em lei, estimativa oficial ou premissa do TribIA"
      >
        <ContaFicaAberta />
      </WalkthroughRow>

      <WalkthroughRow
        index="03"
        kicker="A citação"
        title="A IA não escreve a citação."
        body="Ela aponta qual evidência sustentou a decisão. A referência — artigo, parágrafo, inciso — é remontada pelo servidor a partir dos metadados do trecho, e todo realce que não existir literalmente no texto da lei é descartado."
        footnote="do dossiê você abre o PDF oficial na página exata"
      >
        <ACitacao />
      </WalkthroughRow>

      <WalkthroughRow
        index="04"
        kicker="A decisão"
        title="O consultor assina."
        body="A sugestão da IA nunca é sobrescrita. Quando o consultor decide diferente, o dossiê registra as duas posições — com nota e data — e recalcula o impacto sem repetir a classificação."
      >
        <ConsultorAssina />
      </WalkthroughRow>

      <WalkthroughRow
        index="05"
        kicker="O desfecho"
        title="Termina em ação, não em número."
        body="As despesas que não geram crédito viram uma tabela de ações ordenada pelo valor recuperável ao longo da transição, cada uma com esforço, risco e a base legal da própria classificação."
      >
        <TerminaEmAcao />
      </WalkthroughRow>
    </section>
  )
}
