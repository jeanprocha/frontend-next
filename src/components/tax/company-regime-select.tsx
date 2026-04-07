"use client"

import { CircleHelp } from "lucide-react"
import { GlossaryHelpTrigger } from "@/components/tax/glossary-help-trigger"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CompanyRegimeOption } from "@/store/useTaxStore"

interface CompanyRegimeSelectProps {
  id?: string
  value: CompanyRegimeOption
  onChange: (value: CompanyRegimeOption) => void
  className?: string
  selectClassName?: string
  /** Quando false, omite o rótulo "Perfil tributário" (ex.: ContextHub com cabeçalho próprio). */
  showLabel?: boolean
}

const REGIME_HELP_TEXT =
  "Regime geral: PIS, COFINS e ISS no atual versus CBS/IBS na projeção. Benefícios LC 68/2024: saúde/educação/cultura (-60% na saída projetada); profissões regulamentadas (-30% ilustrativo na alíquota projetada); MEI com DAS fixo ilustrativo. Incentivo social: cesta básica / medicamentos com CBS+IBS zero na saída projetada (créditos nas compras podem deixar o líquido negativo — posição de crédito). Mercado externo: exportadora com CBS+IBS zero na saída projetada e créditos nas compras (ilustrativo). Entidades sem fins lucrativos: imunidade ilustrativa na saída projetada sem créditos no modelo (custo de aquisições na narrativa do produto). Setor imobiliário: projeção com redução sobre a alíquota padrão do ano e redutor opcional de base (ilustrativo). Simples Nacional: modelo ilustrativo no atual e puro/híbrido na projeção. Não substitui orientação profissional."

export function RegimeProfileHelp() {
  return (
    <GlossaryHelpTrigger
      preferSheetOnTouch
      ariaLabel="Sobre os perfis tributários"
      sheetTitle="Perfis tributários"
      content={
        <p className="text-sm leading-relaxed text-inherit">
          {REGIME_HELP_TEXT}
        </p>
      }
      contentClassName="max-w-md pt-0"
      className="inline-flex rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
    >
      <CircleHelp className="size-3.5" aria-hidden />
    </GlossaryHelpTrigger>
  )
}

export function CompanyRegimeSelect({
  id = "company-regime",
  value,
  onChange,
  className,
  selectClassName,
  showLabel = true,
}: CompanyRegimeSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {showLabel ? (
        <div className="flex items-center gap-1.5">
          <Label
            htmlFor={id}
            className="text-xs font-medium text-muted-foreground uppercase tracking-widest"
          >
            Perfil tributário
          </Label>
          <RegimeProfileHelp />
        </div>
      ) : null}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as CompanyRegimeOption)}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-background px-2 text-sm",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          selectClassName,
        )}
      >
        <optgroup label="Regime geral">
          <option value="regular">Lucro Real / Presumido (alíquota cheia)</option>
        </optgroup>
        <optgroup label="Benefícios LC 68/2024">
          <option value="diferenciado_60">Saúde, Educação e Cultura (-60%)</option>
          <option value="prof_liberal">Profissionais liberais (−30% na alíquota projetada)</option>
          <option value="mei">MEI (carga fixa mensal — DAS ilustrativo)</option>
        </optgroup>
        <optgroup label="Simples Nacional">
          <option value="simples_puro">
            Simples puro — crédito restrito (IBS/CBS no DAS, modelo ilustrativo)
          </option>
          <option value="simples_hibrido">
            Simples híbrido — recolhimento por fora (CBS/IBS integral + créditos)
          </option>
        </optgroup>
        <optgroup label="Setor imobiliário">
          <option value="imobiliario_venda">
            Incorporação e venda de imóveis (redução de 40% sobre a alíquota CBS+IBS)
          </option>
          <option value="imobiliario_aluguel">
            Locação e arrendamento (redução de 60% sobre a alíquota CBS+IBS)
          </option>
        </optgroup>
        <optgroup label="Incentivo social">
          <option value="aliquota_zero">
            Cesta básica / medicamentos (alíquota zero CBS+IBS na saída)
          </option>
        </optgroup>
        <optgroup label="Mercado externo">
          <option value="exportadora">
            Exportadora (imunidade ilustrativa CBS+IBS na saída; créditos nas compras)
          </option>
        </optgroup>
        <optgroup label="Entidades sem fins lucrativos">
          <option value="entidade_imune">
            Entidade imune (ONGs, templos, partidos — saída zero; sem créditos no modelo)
          </option>
        </optgroup>
      </select>
    </div>
  )
}
