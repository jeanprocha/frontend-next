"use client"

// Etapa N/PR 4, promovido em D1/Frente D — sair do zero a um veredito sem
// digitar nada é a primeira das 3 prioridades do dono do produto ("a
// simulação ser fácil, e ter opção de gerar dados fictícios, apenas para
// entender o que a plataforma faz"). Montado por DashboardInputPanel como o
// convite proeminente do estado vazio — única fonte de cenários demo do
// simulador (não duplicar em SimulationForm). Só aparece com o formulário
// vazio: carregar por cima de dados já digitados seria uma perda de
// trabalho silenciosa, não um atalho. Nunca dispara a simulação — só
// preenche o formulário; "Simular impacto" continua um clique explícito do
// usuário (custo real de classificação por IA).
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
    <div
      role="region"
      aria-label="Carregar cenário fictício de demonstração"
      className="rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 p-5 sm:p-6 dark:bg-accent/10"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-accent/30"
        >
          <Rocket className="size-4 text-accent" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Quer só entender a plataforma?</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Carregue um cenário fictício de demonstração — contexto, regime, receitas e despesas
            prontos. Você fica a um clique de{" "}
            <span className="font-medium text-foreground">&quot;Simular impacto&quot;</span> do veredito.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {DEMO_SCENARIOS.map((scenario) => (
          <Button
            key={scenario.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadScenario(scenario)}
            className="tribia-touch-target border-accent/30 px-3.5 text-sm hover:border-accent/50 hover:bg-accent/10"
          >
            {scenario.label}
          </Button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground/85">
        Dados fictícios, apenas para demonstração — nenhuma empresa real.
      </p>
    </div>
  )
}
