import type { SimulationResponse } from "@/types/api"

/** Nivo Sankey: nós com `id` string. */
export interface SankeyGraphNode {
  id: string
  label?: string
  nodeColor?: string
}

export interface SankeyGraphLink {
  source: string
  target: string
  value: number
}

export interface SankeyGraphData {
  nodes: SankeyGraphNode[]
  links: SankeyGraphLink[]
}

const EPS = 1e-4

/** Rótulos exibidos no Sankey (ids estáveis). */
export const SANKEY_NODE_LABELS: Record<string, string> = {
  receita: "Receita",
  imposto_bruto: "IBS/CBS bruto (projetado)",
  despesas: "Despesas totais",
  margem: "Margem operacional (ilustrativa)",
  creditos: "Créditos CBS/IBS (elegíveis)",
  custo_efetivo: "Custo efetivo das despesas",
  imposto_liquido: "Imposto líquido a pagar",
  parcela_abatida: "Parcela abatida por créditos",
  recuperacao: "Créditos alocados ao tributo (ilustrativo)",
  posicao_credor: "Excedente credor (ilustrativo)",
}

function parseAmount(s: string | undefined): number {
  if (s == null || s === "") return 0
  const n = parseFloat(String(s).replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function sumExpenseAmounts(expenses: { amount: string }[]): number {
  let t = 0
  for (const e of expenses) {
    t += parseAmount(e.amount)
  }
  return Math.round(t * 100) / 100
}

function sumServiceAmounts(services: { amount: string }[]): number {
  let t = 0
  for (const s of services) {
    t += parseAmount(s.amount)
  }
  return Math.round(t * 100) / 100
}

/**
 * Resolve receita: `revenue_total` da API ou soma opcional de serviços.
 */
function resolveRevenue(
  simulation: SimulationResponse,
  services?: { amount: string }[],
): number {
  const fromApi = parseAmount(simulation.revenue_total)
  if (fromApi > EPS) return fromApi
  if (services?.length) return sumServiceAmounts(services)
  return 0
}

function pushLink(
  links: SankeyGraphLink[],
  source: string,
  target: string,
  value: number,
) {
  if (value > EPS) {
    links.push({ source, target, value: Math.round(value * 100) / 100 })
  }
}

/**
 * Monta dados para Sankey do cenário **projetado** (CBS/IBS).
 * Pré-requisitos: pelo menos uma despesa no formulário (fluxo de caixa para créditos).
 * Retorna null se não houver base para desenhar.
 *
 * Premissa ilustrativa: a receita reparte-se em imposto bruto projetado, despesas e margem;
 * as despesas repartem-se entre custo efetivo e “retorno” de créditos; o imposto bruto
 * reparte-se entre líquido a pagar e parcela abatida por créditos (coerente com net = G − C
 * quando os números da API fecham).
 */
export function buildCreditFlowSankey(
  simulation: SimulationResponse,
  expenses: { amount: string }[],
  services?: { amount: string }[],
): SankeyGraphData | null {
  if (!expenses.length) return null

  const R = resolveRevenue(simulation, services)
  const G = parseAmount(simulation.projected.gross_tax)
  const C = parseAmount(simulation.projected.credits)
  const N = parseAmount(simulation.projected.net_tax)
  const E = sumExpenseAmounts(expenses)

  if (R <= EPS && G <= EPS && E <= EPS) return null

  const ce = Math.min(C, E)
  const custoEfetivo = Math.max(0, E - ce)
  const netPay = Math.max(0, N)
  const abatidoNoBruto = Math.max(0, G - netPay)

  const M = Math.max(0, R - G - E)

  const creditoAlocadoAoTributo = Math.min(ce, G)
  const creditoExcedente = Math.max(0, ce - G)

  const nodes: SankeyGraphNode[] = [
    { id: "receita", label: "Receita", nodeColor: "#3b82f6" },
    { id: "imposto_bruto", label: "IBS/CBS bruto (projetado)", nodeColor: "#f87171" },
    { id: "despesas", label: "Despesas totais", nodeColor: "#94a3b8" },
    { id: "margem", label: "Margem operacional (ilustrativa)", nodeColor: "#6366f1" },
    { id: "creditos", label: "Créditos CBS/IBS (elegíveis)", nodeColor: "#10b981" },
    { id: "custo_efetivo", label: "Custo efetivo das despesas", nodeColor: "#475569" },
    { id: "imposto_liquido", label: "Imposto líquido a pagar", nodeColor: "#ef4444" },
    {
      id: "parcela_abatida",
      label: "Parcela abatida por créditos",
      nodeColor: "#34d399",
    },
    { id: "recuperacao", label: "Créditos alocados ao tributo (ilustrativo)", nodeColor: "#059669" },
  ]

  if (creditoExcedente > EPS) {
    nodes.push({
      id: "posicao_credor",
      label: "Excedente credor (ilustrativo)",
      nodeColor: "#10b981",
    })
  }

  const links: SankeyGraphLink[] = []

  pushLink(links, "receita", "imposto_bruto", G)
  pushLink(links, "receita", "despesas", E)
  pushLink(links, "receita", "margem", M)

  pushLink(links, "despesas", "creditos", ce)
  pushLink(links, "despesas", "custo_efetivo", custoEfetivo)

  pushLink(links, "imposto_bruto", "imposto_liquido", netPay)
  pushLink(links, "imposto_bruto", "parcela_abatida", abatidoNoBruto)

  pushLink(links, "creditos", "recuperacao", creditoAlocadoAoTributo)
  pushLink(links, "creditos", "posicao_credor", creditoExcedente)

  const used = new Set<string>()
  for (const l of links) {
    used.add(l.source)
    used.add(l.target)
  }
  const activeNodes = nodes.filter((n) => used.has(n.id))

  if (links.length === 0) return null

  return { nodes: activeNodes, links }
}
