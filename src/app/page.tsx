import type { Metadata } from "next"
import { DocumentHero } from "@/components/marketing/document-hero"
import { ProductWalkthrough } from "@/components/marketing/product-walkthrough"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { WhatsIncluded } from "@/components/marketing/whats-included"
import { ProductLimits } from "@/components/marketing/product-limits"
import { LandingFooter } from "@/components/marketing/landing-footer"

/**
 * Landing — Etapa M/PR 10 (docs/roadmap-execucao.md §4.2). Estrutura "o
 * dossiê é a página" (docs/product/04-landing.md): o entregável ocupa a
 * primeira dobra em escala, cortado por ela; cada seção seguinte mostra o
 * artefato real do produto ao lado do texto. Foco em apresentar, não vender
 * — sem preço, sem CTA de compra, sem promessa de simulação self-service.
 */
export const metadata: Metadata = {
  title: "TribIA — Um parecer, não uma estimativa",
  description:
    "Diagnóstico da reforma tributária (CBS/IBS, 2026–2033): classificação de crédito com citação auditável da LC 214/2025, motor de cálculo determinístico e dossiê compartilhável.",
}

export default function LandingPage() {
  return (
    <main>
      <DocumentHero />
      <ProductWalkthrough />
      <HowItWorks />
      <WhatsIncluded />
      <ProductLimits />
      <LandingFooter />
    </main>
  )
}
