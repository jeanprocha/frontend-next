"use client"

import { useEngineValidation } from "@/lib/use-engine-validation"
import { formatIsoDatePtBR as formatRunAt } from "@/lib/format-iso-date-ptbr"
import type { ReportSection } from "@/lib/report-contract"

/**
 * PRODUCT.md: "selos de validação... trabalho futuro não pode fabricar" —
 * só monta com isLive (validated:true vindo de verdade da API). Sem
 * fallback estático: ao contrário do selo de base legal (que sempre tem uma
 * data honesta pra mostrar), um selo de validação do motor não tem forma
 * estática que não seja fabricação (ver use-engine-validation.ts).
 *
 * Texto limitado pelo escopo real (validation.scope), nunca "motor
 * validado" genérico — a calculadora oficial não cobre PIS/COFINS, ISS,
 * ICMS, IPI, Simples, MEI nem as premissas ilustrativas do TribIA.
 *
 * O que a validação NÃO cobre (validation.out_of_scope) é exibido junto, e não
 * só disponível no payload: "validado" é a afirmação mais forte do dossiê, e a
 * primeira pergunta de um leitor cético ("valida os créditos também?") precisa
 * ter resposta aqui, antes de ser feita — não numa evidência que ele não vê.
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
  const foraDoEscopo = validation.out_of_scope?.filter((s) => s.trim()) ?? []

  return (
    <div className="px-1 pb-2">
      {/* Fluxo de prosa, não flex: com flex o texto quebrava em blocos
          desalinhados em telas estreitas (achado do critique). */}
      <p
        role="note"
        aria-label={`${escopo} validados contra a Calculadora de Tributos RFB versão ${versao} — ${validation.cases_total} casos, ${dataExecucao}`}
        className="text-[11px] leading-snug text-muted-foreground"
      >
        <span aria-hidden className="mr-1.5 inline-block size-1.5 rounded-full bg-accent align-middle" />
        <span className="font-medium text-foreground">{escopo}</span> validados contra a Calculadora de Tributos RFB versão{" "}
        {versao} — {validation.cases_total} casos, {dataExecucao}
      </p>
      {foraDoEscopo.length > 0 && (
        <p className="mt-1 pl-3 text-[11px] leading-snug text-muted-foreground/90">
          A validação não cobre: {foraDoEscopo.join(", ")}.
        </p>
      )}
    </div>
  )
}

export const motorValidadoSeloSection: ReportSection = {
  id: "motor-validado-selo",
  title: "Selo de validação do motor (RFB)",
  print: "always",
  screenTab: "veredito",
  Component: MotorValidadoSeloSection,
}
