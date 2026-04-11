import Link from "next/link"
import { Show, SignInButton } from "@clerk/nextjs"
import {
  ArrowRight,
  CheckCircle,
  Zap,
  Scale,
  BarChart2,
  Upload,
  Sparkles,
  TrendingDown,
  ExternalLink,
} from "lucide-react"

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-background">
      {/* Grid decorativo de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"
      />
      {/* Glow de acento */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-64 w-[600px] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
        {/* Badge legal */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Scale className="h-3 w-3" />
          LC 68/2024 · CBS · IBS · Imposto Seletivo
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Sua empresa está pronta{" "}
          <span className="text-accent">para 2026?</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Simule o impacto da Reforma Tributária Brasileira com IA. O TribIA
          classifica seus créditos de CBS/IBS citando os artigos exatos da lei
          e calcula a carga líquida com precisão decimal.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {/* CTA primário — adapta ao estado de auth */}
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              Ir para o Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                Simular Agora
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignInButton>
          </Show>

          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80"
          >
            Ver como funciona
          </a>
        </div>

        {/* Prova técnica mínima */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          {[
            "Busca vetorial na LC 68/2024",
            "Motor de cálculo em Go",
            "Créditos com base legal rastreável",
            "Precisão decimal garantida",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Como Funciona ─────────────────────────────────────────────────────────────

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Informe seus dados",
    description:
      "Cadastre seus serviços e despesas pelo formulário ou faça upload de um CSV. O sistema aceita lotes de centenas de itens.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "IA classifica os créditos",
    description:
      "O RAG busca semanticamente na LC 68/2024 e o LLM decide a elegibilidade com justificativa jurídica rastreável — sem alucinações.",
  },
  {
    icon: BarChart2,
    number: "03",
    title: "Comparativo instantâneo",
    description:
      "O motor em Go calcula imposto bruto, créditos abatíveis e carga líquida. Veja o delta entre o regime atual e a transição CBS/IBS.",
  },
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="border-b bg-muted/30 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
            Fluxo
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Como funciona
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Três etapas. Da despesa ao relatório, em segundos.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-xl border bg-background p-6 shadow-sm"
            >
              {/* Número decorativo */}
              <span className="absolute right-5 top-5 font-mono text-4xl font-bold text-muted/40 select-none">
                {step.number}
              </span>

              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <step.icon className="h-5 w-5 text-accent" />
              </div>

              <h3 className="mb-2 font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ──────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Scale,
    title: "RAG Jurídico",
    description:
      "Busca vetorial direta na LC 68/2024 com embeddings OpenAI. Cada classificação cita o artigo de origem — auditável por qualquer contador ou advogado tributário.",
    highlight: "Sem alucinações. Base legal rastreável.",
  },
  {
    icon: Zap,
    title: "Motor Determinístico em Go",
    description:
      "Cálculo com shopspring/decimal — sem erros de arredondamento de float64. Goroutines processam lotes de centenas de despesas em paralelo, com semáforo de concorrência para a API de IA.",
    highlight: "Precisão decimal. Performance de produção.",
  },
  {
    icon: TrendingDown,
    title: "Cenários de Transição 2026–2033",
    description:
      "Alíquotas de CBS e IBS seguem o cronograma da EC 132 e do Art. 345 da LC 68/2024. Simule qualquer ano da transição e veja a extinção gradual do PIS/COFINS.",
    highlight: "Regras configuradas por período legal.",
  },
]

function Features() {
  return (
    <section className="border-b py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
            Tecnologia
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            O que está por baixo
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Engenharia de produto, não mágica de chatbot.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feat) => (
            <div
              key={feat.title}
              className="rounded-xl border bg-background p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feat.icon className="h-5 w-5 text-primary" />
              </div>

              <h3 className="mb-2 font-semibold">{feat.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                {feat.description}
              </p>

              <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/8 px-2.5 py-0.5 text-xs font-medium text-accent">
                <CheckCircle className="h-3 w-3" />
                {feat.highlight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "Ideal para testar o impacto da reforma na sua empresa.",
    features: [
      "5 simulações por mês",
      "Classificação de até 15 despesas por lote",
      "Evidência legal por item",
      "Comparativo 2026",
    ],
    cta: "Começar grátis",
    href: "/dashboard",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Em breve",
    period: "",
    description:
      "Para equipes de finanças e contabilidade que precisam de escala.",
    features: [
      "Simulações ilimitadas",
      "Lotes de até 500 despesas",
      "Todos os anos de transição (2026–2033)",
      "Exportação PDF e CSV",
      "API access (JSON)",
    ],
    cta: "Entrar na lista de espera",
    href: "#",
    highlighted: true,
  },
]

function Pricing() {
  return (
    <section id="planos" className="border-b bg-muted/30 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
            Planos
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Simples e transparente
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Comece gratuitamente. Escale quando precisar.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-7 shadow-sm ${
                plan.highlighted
                  ? "border-accent/40 bg-background ring-1 ring-accent/20"
                  : "bg-background"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                  <Sparkles className="h-3 w-3" />
                  Em breve
                </span>
              )}

              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">
                    / {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>

              <ul className="my-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.highlighted ? (
                <span className="block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed">
                  {plan.cta}
                </span>
              ) : (
                <>
                  <Show when="signed-in">
                    <Link
                      href={plan.href}
                      className="block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {plan.cta}
                    </Link>
                  </Show>
                  <Show when="signed-out">
                    <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                      <button className="block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold bg-primary text-primary-foreground transition-opacity hover:opacity-90">
                        {plan.cta}
                      </button>
                    </SignInButton>
                  </Show>
                </>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sem cartão de crédito. Sem pegadinha. Cancele quando quiser.
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Brand */}
          <span className="font-mono text-sm font-bold text-primary">
            ◈ TribIA
          </span>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link
              href="/privacidade"
              className="transition-colors hover:text-foreground"
            >
              Privacidade e dados
            </Link>
            <a
              href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp68.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              LC 68/2024
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              GitHub
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </nav>

          <p className="text-xs text-muted-foreground">
            Projeto de portfólio. Não é aconselhamento fiscal.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <Footer />
    </main>
  )
}
