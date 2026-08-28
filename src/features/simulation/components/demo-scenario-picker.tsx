"use client"

// Etapa N/PR 4 — sair do zero a um veredito sem digitar nada. Só aparece com
// o formulário vazio (SimulationForm condiciona): carregar por cima de dados
// já digitados seria uma perda de trabalho silenciosa, não um atalho.
import { Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTaxStore } from "@/store/useTaxStore"
import { DEMO_SCENARIOS, materializeDemoScenario, type DemoScenario } from "../lib/demo-scenarios"

export function DemoScenarioPicker() {
  const setYear = useTaxStore((s) => s.setYear)
  const setCompanyContext = useTaxStore((s) => s.setCompanyContext)
  const setCompanyRegime = useTaxStore((s) => s.setCompanyRegime)
  const setImobiliarioRedutorAjusteBrl = useTaxStore((s) => s.setImobiliarioRedutorAjusteBrl)
  const setServices = useTaxStore((s) => s.setServices)
  const setExpenses = useTaxStore((s) => s.setExpenses)

  function loadScenario(scenario: DemoScenario) {
    const m = materializeDemoScenario(scenario)
    setYear(2026)
    setImobiliarioRedutorAjusteBrl("")
    setCompanyContext(m.companyContext)
    setCompanyRegime(m.companyRegime)
    setServices(m.services)
    setExpenses(m.expenses)
  }

  return (
    <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4 dark:bg-accent/10">
      <div className="flex items-center gap-2">
        <Rocket className="size-4 shrink-0 text-accent" aria-hidden />
        <p className="text-sm font-medium text-foreground">Quer testar sem digitar nada?</p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Carregue um cenário de exemplo — contexto, regime, receitas e despesas prontos para simular.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEMO_SCENARIOS.map((scenario) => (
          <Button
            key={scenario.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadScenario(scenario)}
            className="h-8 border-accent/30 text-xs hover:border-accent/50 hover:bg-accent/10"
          >
            {scenario.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
