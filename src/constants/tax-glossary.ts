/**
 * Definições educativas para tooltips na UI. Textos ilustrativos;
 * não substituem legislação ou parecer técnico.
 */
export const TAX_GLOSSARY = {
  "Split Payment":
    "Mecanismo em que o imposto pode ser retido e recolhido no fluxo financeiro da operação, reduzindo risco de inadimplência.",
  "Alíquota de Equilíbrio":
    "Alíquota de referência usada em modelos de transição para aproximar a carga líquida entre regime atual e CBS/IBS, segundo as premissas do simulador.",
  "Não-cumulatividade Plena":
    "Princípio em que os tributos sobre consumo admitem aproveitamento de crédito das aquisições vinculadas à atividade, mitigando efeito em cascata.",
  "Saldo Credor":
    "Valor de créditos acumulados que pode ser compensado com débitos futuros ou, quando previsto, ressarcido ou transferido conforme regras legais.",
  IBS: "Imposto sobre Bens e Serviços. Tributo de competência compartilhada (estadual e municipal) previsto na reforma, em substituição a parcelas do ICMS e do ISS.",
  CBS: "Contribuição sobre Bens e Serviços. Tributo federal previsto na reforma, em substituição a parcelas do PIS e da COFINS.",
  IS: "Imposto Seletivo. Tributo federal incidente sobre bens e serviços com externalidades negativas ou altíssimo grau de essencialidade, conforme legislação aplicável.",
} as const

export type TaxGlossaryTerm = keyof typeof TAX_GLOSSARY
