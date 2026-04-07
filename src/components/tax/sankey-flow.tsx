"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import type { SankeyLinkDatum, SankeyNodeDatum } from "@nivo/sankey"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBRL } from "@/lib/api"
import {
  buildCreditFlowSankey,
  SANKEY_NODE_LABELS,
  type SankeyGraphData,
} from "@/lib/tax-sankey"
import type { FormExpense, SimulationResponse } from "@/types/api"

type FlowNode = { id: string; label?: string; nodeColor?: string }

/** Cores por id (Nivo não expõe campos custom no accessor `colors`). */
const NODE_COLORS: Record<string, string> = {
  receita: "#3b82f6",
  imposto_bruto: "#f87171",
  despesas: "#94a3b8",
  margem: "#6366f1",
  creditos: "#10b981",
  custo_efetivo: "#475569",
  imposto_liquido: "#ef4444",
  parcela_abatida: "#34d399",
  recuperacao: "#059669",
  posicao_credor: "#10b981",
}

const ResponsiveSankey = dynamic(
  () => import("@nivo/sankey").then((m) => m.ResponsiveSankey),
  { ssr: false, loading: () => <div className="h-[480px] w-full animate-pulse rounded-md bg-muted/40" /> },
)

function LinkTooltip({ link }: { link: SankeyLinkDatum<FlowNode, { source: string; target: string; value: number }> }) {
  const src = SANKEY_NODE_LABELS[link.source.id] ?? link.source.id
  const tgt = SANKEY_NODE_LABELS[link.target.id] ?? link.target.id
  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md">
      <span className="font-medium">{src}</span>
      <span className="text-muted-foreground"> → </span>
      <span className="font-medium">{tgt}</span>
      <div className="mt-1 tabular-nums font-semibold text-foreground">{formatBRL(String(link.value))}</div>
    </div>
  )
}

function NodeTooltip({ node }: { node: SankeyNodeDatum<FlowNode, { source: string; target: string; value: number }> }) {
  return (
    <div className="rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md">
      <div className="font-medium">{SANKEY_NODE_LABELS[node.id] ?? node.id}</div>
      <div className="mt-0.5 tabular-nums text-muted-foreground">
        Fluxo agregado: {formatBRL(String(node.value))}
      </div>
    </div>
  )
}

function SankeyInner({ data }: { data: SankeyGraphData }) {
  const nivoData = useMemo(
    () => ({
      nodes: data.nodes as FlowNode[],
      links: data.links,
    }),
    [data],
  )

  return (
    <div className="h-[480px] w-full min-h-[320px]">
      <ResponsiveSankey
        data={nivoData}
        margin={{ top: 24, right: 140, bottom: 24, left: 48 }}
        align="justify"
        colors={(node) => NODE_COLORS[node.id] ?? "#64748b"}
        nodeThickness={14}
        nodeSpacing={20}
        nodeBorderWidth={0}
        linkOpacity={0.35}
        linkHoverOpacity={0.65}
        linkHoverOthersOpacity={0.12}
        linkContract={2}
        enableLinkGradient
        enableLabels
        label={(node) => SANKEY_NODE_LABELS[node.id] ?? node.id}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={12}
        labelTextColor={{ from: "color", modifiers: [["darker", 1.4]] }}
        linkTooltip={LinkTooltip}
        nodeTooltip={NodeTooltip}
        theme={{
          labels: { text: { fontSize: 11 } },
        }}
      />
    </div>
  )
}

export interface SankeyFlowProps {
  simulation: SimulationResponse
  expenses: FormExpense[]
  /** Opcional: soma de receita se `revenue_total` vier vazio da API */
  services?: { amount: string }[]
}

export function SankeyFlow({ simulation, expenses, services }: SankeyFlowProps) {
  const graph = useMemo(
    () => buildCreditFlowSankey(simulation, expenses, services),
    [simulation, expenses, services],
  )

  if (!graph) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Fluxo de valor e créditos (projetado)</CardTitle>
          <CardDescription>
            Inclua pelo menos uma despesa na simulação para visualizar o fluxo entre receita, despesas e créditos CBS/IBS.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Fluxo de valor e créditos (projetado)</CardTitle>
        <CardDescription>
          Visão ilustrativa: receita, IBS/CBS bruto, despesas, créditos elegíveis e imposto líquido — modelo TribIA, não parecer fiscal.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <SankeyInner data={graph} />
        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground uppercase tracking-wide">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[#10b981]" aria-hidden />
            Créditos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[#ef4444]" aria-hidden />
            Imposto líquido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[#3b82f6]" aria-hidden />
            Receita
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
