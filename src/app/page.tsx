import Link from "next/link"
import { Show, SignInButton } from "@clerk/nextjs"
import { ArrowRight, CheckCircle, ExternalLink, Sparkles, Scale } from "lucide-react"
import { ProductFlowLinear } from "@/components/marketing/product-flow-linear"
import { TechnologyPilarGrid } from "@/components/marketing/technology-pilar-grid"
import { ROTAS } from "@/constants/routes"

// ─── Hero ─────────────────────────────────────────────────────────────────────

const heroTrustPoints = [
  "Segurança Jurídica RAG",
  "Motor Go Determinístico",
  "Precisão Decimal Monetária",
] as const

const ctaPrimaryClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"

const ctaSecondaryClass =
  "inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80"

function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-64 w-[600px] rounded-full bg-emerald-600/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Scale className="h-3 w-3" aria-hidden />
          LC 68/2024 · CBS · IBS · Imposto Seletivo
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Domine a Reforma Tributária. Mitigue riscos e projete seu caixa com{" "}
          <span className="text-emerald-600">precisão absoluta</span>.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          O TribIA combina IA-RAG para classificação jurídica com um motor Go
          determinístico para calcular sua carga líquida CBS/IBS (2026–2033) com
          base na LC 68/2024. Sem alucinações.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Show when="signed-in">
            <Link href={ROTAS.clientes} className={ctaPrimaryClass}>
              <span className="inline-flex items-center gap-2">
                Ir para o Dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className={ctaPrimaryClass}>
                <span className="inline-flex items-center gap-2">
                  Simular agora
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </button>
            </SignInButton>
          </Show>

          <a href="#como-funciona" className={ctaSecondaryClass}>
            Ver o fluxo
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          {heroTrustPoints.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
              {item}
            </span>
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
    description:
      "Ideal para testes táticos: valide a narrativa, o batch e o comparativo instantâneo 2026 antes de escalar a equipa.",
    features: [
      "5 simulações por mês",
      "Classificação de até 15 despesas por lote",
      "Evidência legal por item",
      "Comparativo 2026 e veredito numérico claro",
    ],
    cta: "Começar grátis",
    href: ROTAS.clientes,
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Em breve",
    period: "",
    description:
      "Para equipas que precisam de auditoria rigorosa e projeção de caixa em todo o arco 2026–2033, com rastreio LC 68/2024 e saída auditável.",
    features: [
      "Simulações ilimitadas",
      "Lotes de até 500 despesas",
      "Comparativo A/B e todos os anos (2026–2033)",
      "Exportação CSV (audit-ready) e dossié digital apresentável",
    ],
    cta: "Entrar na lista de espera",
    href: "#",
    highlighted: true,
  },
] as const

function Pricing() {
  return (
    <section id="planos" className="border-b bg-muted/30 py-20">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-600">
            Planos
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Simples e transparente</h2>
          <p className="mt-3 text-sm text-muted-foreground">Comece gratuitamente. Escale quando precisar.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-7 shadow-sm ${
                plan.highlighted
                  ? "border-emerald-600/30 bg-background ring-1 ring-emerald-600/15"
                  : "bg-background"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Em breve
                </span>
              )}

              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                {plan.period ? (
                  <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="my-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.highlighted ? (
                <span className="block w-full cursor-not-allowed rounded-lg bg-muted px-4 py-2.5 text-center text-sm font-semibold text-muted-foreground">
                  {plan.cta}
                </span>
              ) : (
                <>
                  <Show when="signed-in">
                    <Link
                      href={plan.href}
                      className="block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      {plan.cta}
                    </Link>
                  </Show>
                  <Show when="signed-out">
                    <SignInButton mode="modal" fallbackRedirectUrl={ROTAS.clientes}>
                      <button
                        type="button"
                        className="block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                      >
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
          <span className="font-mono text-sm font-bold text-foreground">◈ TribIA</span>
          <nav className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            <Link href={ROTAS.clientes} className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-foreground">
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
          <p className="text-xs text-muted-foreground">Projeto de portfólio. Não é aconselhamento fiscal.</p>
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
      <TechnologyPilarGrid />
      <ProductFlowLinear />
      <Pricing />
      <Footer />
    </main>
  )
}
