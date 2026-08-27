"use client"

import { useEngineValidation } from "@/lib/use-engine-validation"
import type { ReportSection } from "@/lib/report-contract"

/**
 * timeZone: "UTC" — mesma correção da PR 9/W1 (base-legal-selo.tsx): o
 * backend emite datas ISO "YYYY-MM-DD" (meia-noite UTC); sem isso, qualquer
 * fuso negativo (Brasil, UTC-3) mostraria o dia anterior.
 */
function formatRunAt(iso?: string): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    })
  } catch {
    return iso
  }
}

/**
 * PRODUCT.md: "selos de validação... trabalho futuro não pode fabricar" —
 * só monta com isLive (validated:true vindo de verdade da API). Sem
 * fallback estático: ao contrário do selo de base legal (que sempre tem uma
 * data honesta pra mostrar), um selo de validação do motor não tem forma
 * estática que não seja fabricação (ver use-engine-validation.ts).
 *
 * Texto limitado pelo escopo real (validation.scope), nunca "motor
 * validado" genérico — a calculadora oficial não cobre PIS/COFINS, ISS,
 * ICMS, IPI, Simples, MEI nem as premissas ilustrativas do TribIA
 * (ver validation.out_of_scope, acessível no payload para quem quiser).
 *
 * O texto nomeia a VERSÃO da calculadora: ela é beta e muda de versão, então
 * "validado" sem dizer contra o quê é afirmação mais forte do que a evidência
 * sustenta (risco mapeado no plano do W7). Sem versão não há selo — o backend
 * já recusa validated:true nesse caso (internal/enginevalidation.Build), e a
 * guarda abaixo cobre um backend antigo que ainda não carimbe a versão.
 */
function MotorValidadoSeloSection() {
  const { validation, isLive } = useEngineValidation()
  if (!isLive || !validation) return null

  const versao = validation.reference.version?.trim()
  if (!versao) return null

  const dataExecucao = formatRunAt(validation.reference.run_at)
  const escopo = validation.scope.join(" + ")

  return (
    <p
      role="note"
      aria-label={`${escopo} validados contra a Calculadora de Tributos RFB versão ${versao} — ${validation.cases_total} casos, ${dataExecucao}`}
      className="flex items-center gap-1.5 px-1 pb-2 text-[11px] leading-none text-muted-foreground"
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
      <span className="font-medium text-foreground">{escopo}</span> validados contra a Calculadora de Tributos RFB versão{" "}
      {versao} — {validation.cases_total} casos, {dataExecucao}
    </p>
  )
}

export const motorValidadoSeloSection: ReportSection = {
  id: "motor-validado-selo",
  title: "Selo de validação do motor (RFB)",
  print: "always",
  screenTab: "veredito",
  Component: MotorValidadoSeloSection,
}
