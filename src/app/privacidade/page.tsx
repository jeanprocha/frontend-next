import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacidade e dados — TribIA",
  description:
    "Como o TribIA trata identidade, armazenamento e fornecedores de IA (política declarativa).",
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 pb-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Transparência
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Privacidade e dados
      </h1>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        O TribIA posiciona-se como ferramenta de software e análise tributária, não como
        experimento de chatbot. Esta página resume o tratamento de dados em alto nível;
        o detalhe técnico e o mantra de engenharia estão no repositório em{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
          frontend-next/docs/seguranca-dados-hardening.md
        </code>
        .
      </p>

      <section className="mt-10 space-y-3 text-sm leading-relaxed text-foreground">
        <h2 className="text-base font-semibold">Identidade e sessão</h2>
        <p className="text-muted-foreground">
          A autenticação é feita com Clerk (sessão no navegador, JWT nas chamadas à API
          quando aplicável). O servidor Go valida o token em produção conforme a
          configuração do ambiente.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-foreground">
        <h2 className="text-base font-semibold">Armazenamento</h2>
        <p className="text-muted-foreground">
          Dados persistidos pelo produto (por exemplo histórico de simulações e modelos
          de empresa) utilizam Supabase (PostgreSQL) no desenho actual.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-foreground">
        <h2 className="text-base font-semibold">IA e fornecedores</h2>
        <p className="text-muted-foreground">
          A classificação assistida e o RAG sobre a legislação chamam APIs de fornecedores
          (por exemplo OpenAI, Google) no âmbito do serviço. O TribIA não utiliza os seus
          dados para treinar modelos próprios do produto.
        </p>
        <p className="text-muted-foreground">
          Cada fornecedor tem políticas próprias sobre retenção, melhoria de serviço e
          opt-outs; consulte a documentação oficial do fornecedor e o assessoramento
          jurídico da sua organização antes de assumir garantias absolutas.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-foreground">
        <h2 className="text-base font-semibold">Retenção</h2>
        <p className="text-muted-foreground">
          A limpeza automática por tempo (TTL) e políticas de retenção por tipo de dado
          são evoluções futuras, salvo decisão explícita de produto e legal.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-foreground">
        <h2 className="text-base font-semibold">Erros e suporte</h2>
        <p className="text-muted-foreground">
          Em falhas de API, quando disponível, o sistema mostra um
          <strong className="font-medium text-foreground"> ID do pedido</strong> —
          o mesmo valor corre nos logs do servidor para correlação com o suporte.
        </p>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        <Link href="/" className="text-accent underline-offset-4 hover:underline">
          Voltar ao início
        </Link>
        {" · "}
        <Link
          href="/dashboard"
          className="text-accent underline-offset-4 hover:underline"
        >
          Simulador
        </Link>
      </p>
    </main>
  )
}
