"use client"

// W7/B2.1 (PR 3) — selo "na dobra": o motor foi validado ao vivo contra a
// Calculadora oficial da RFB (internal/enginevalidation). Mesma regra de
// PRODUCT.md que features/engine-validation/sections/motor-validado-selo.tsx
// (dentro do dossiê): sem validated:true vindo da API agora, não renderiza
// nada — nunca um selo estático fabricado. useEngineValidation vive em lib/
// justamente para poder ser usado fora de features/ (components/ não pode
// importar de features/, ver eslint.config.mjs).
import { ShieldCheck } from "lucide-react"
import { useEngineValidation } from "@/lib/use-engine-validation"

export function RfbValidationBadge() {
  const { validation, isLive } = useEngineValidation()
  if (!isLive || !validation) return null

  const versao = validation.reference.version?.trim()
  if (!versao) return null

  const escopo = validation.scope.join(" + ")
  const detalhe = `Validado contra a Calculadora de Tributos RFB versão ${versao} — escopo: ${escopo}, ${validation.cases_total} casos conferidos, ${validation.cases_divergent} divergências`

  return (
    <p
      role="note"
      title={detalhe}
      aria-label={detalhe}
      className="mt-2.5 flex w-fit items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[13px] text-emerald-800 dark:text-emerald-300"
    >
      <ShieldCheck aria-hidden className="size-3.5 shrink-0" />
      Motor validado contra a <span className="font-medium">Calculadora oficial da RFB</span> —{" "}
      {validation.cases_total} anos conferidos,{" "}
      {validation.cases_divergent === 0 ? "zero divergência" : `${validation.cases_divergent} divergência(s)`}
    </p>
  )
}
