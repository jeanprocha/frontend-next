// Etapa N/PR 4 — cenários de exemplo curados, um por regime, para simular
// sem digitar nada. Deliberadamente NÃO aleatórios: a tese do produto é que
// a IA classifica citando a lei, e descrição sem sentido produz citação
// fraca — a demo exibiria o produto falhando no próprio diferencial. Cada
// cenário usa descrições reais e plausíveis, do mesmo jeito que
// public/despesas.csv, para que a classificação RAG funcione de verdade.
import type { CompanyRegimeOption } from "@/lib/company-regime"
import type { FormExpense, FormService } from "@/types/api"
import { makeLineId } from "@/lib/simulation-line-helpers"

interface DemoServiceLine {
  description: string
  amount: string
  iss_rate: string
}

interface DemoExpenseLine {
  description: string
  amount: string
}

export interface DemoScenario {
  id: string
  /** Rótulo curto do botão — não é o contexto completo. */
  label: string
  companyContext: string
  companyRegime: CompanyRegimeOption
  services: DemoServiceLine[]
  expenses: DemoExpenseLine[]
}

export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: "agencia-marketing",
    label: "Agência de marketing",
    companyContext:
      "Agência de marketing digital, regime regular, presta serviços de gestão de redes sociais e campanhas de mídia paga para clientes B2B.",
    companyRegime: "regular",
    services: [
      { description: "Gestão de redes sociais", amount: "8000.00", iss_rate: "0.05" },
      { description: "Planejamento de campanhas de mídia paga", amount: "6000.00", iss_rate: "0.05" },
    ],
    expenses: [
      { description: "Assinatura de ferramentas de design (Canva, Adobe Creative Cloud)", amount: "450.00" },
      { description: "Aluguel de coworking", amount: "1800.00" },
      { description: "Freelancers de produção de conteúdo", amount: "3200.00" },
      { description: "Software de gestão de projetos e CRM", amount: "600.00" },
    ],
  },
  {
    id: "clinica-fisioterapia",
    label: "Clínica de fisioterapia",
    companyContext:
      "Clínica de fisioterapia, regime de profissional liberal, presta atendimento e reabilitação física a pacientes particulares e convênios.",
    companyRegime: "prof_liberal",
    services: [
      { description: "Sessões de fisioterapia", amount: "12000.00", iss_rate: "0.03" },
      { description: "Avaliação e diagnóstico postural", amount: "2500.00", iss_rate: "0.03" },
    ],
    expenses: [
      { description: "Aluguel do consultório", amount: "3000.00" },
      { description: "Equipamentos de fisioterapia", amount: "2200.00" },
      { description: "Material de consumo (faixas, géis, luvas)", amount: "600.00" },
      { description: "Honorários de recepcionista terceirizada", amount: "1800.00" },
    ],
  },
  {
    id: "escritorio-contabilidade",
    label: "Escritório de contabilidade",
    companyContext:
      "Escritório de contabilidade, regime Simples Nacional híbrido, presta serviços de contabilidade e consultoria fiscal para pequenas empresas.",
    companyRegime: "simples_hibrido",
    services: [
      { description: "Contabilidade mensal (fechamento e obrigações)", amount: "9000.00", iss_rate: "0.02" },
      { description: "Consultoria tributária avulsa", amount: "3500.00", iss_rate: "0.02" },
    ],
    expenses: [
      { description: "Assinatura de sistema contábil", amount: "890.00" },
      { description: "Aluguel da sede", amount: "2500.00" },
      { description: "Internet e telefonia", amount: "350.00" },
      { description: "Material de escritório", amount: "200.00" },
    ],
  },
]

export interface MaterializedDemoScenario {
  companyContext: string
  companyRegime: CompanyRegimeOption
  services: FormService[]
  expenses: FormExpense[]
}

/** Gera ids frescos por materialização — o mesmo cenário pode ser carregado mais de uma vez na sessão. */
export function materializeDemoScenario(scenario: DemoScenario): MaterializedDemoScenario {
  return {
    companyContext: scenario.companyContext,
    companyRegime: scenario.companyRegime,
    services: scenario.services.map((s) => ({ id: makeLineId(), ...s })),
    expenses: scenario.expenses.map((e) => ({ id: makeLineId(), ...e })),
  }
}
