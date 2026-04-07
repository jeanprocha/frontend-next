"use client"

import { FileSearch, ReceiptText, Sparkles } from "lucide-react"
import { EmptyStateBox } from "@/components/tax/empty-state-box"
import { SHORTCUT_KEYS } from "@/constants/shortcuts"
import { cn } from "@/lib/utils"

export interface EmptyStateCardProps {
  type: "service" | "expense"
  onAdd: () => void
}

const COPY = {
  service: {
    title: "Passo 1/3: Identifique suas fontes de receita para o mapeamento IBS/CBS.",
    description:
      "O TribIA mapeia automaticamente a incidência de ISS e projeta a transição para o IBS/CBS conforme a LC 68/2024.",
    cta: "Adicionar receita",
    aria: "Passo 1 do pipeline: adicionar primeiro serviço ou receita",
  },
  expense: {
    title: "Passo 2/3: Insira custos para o motor RAG identificar créditos automáticos.",
    description:
      "A IA classifica cada item para elegibilidade de créditos tributários em tempo real via RAG.",
    cta: "Adicionar despesa",
    aria: "Passo 2 do pipeline: adicionar primeira despesa para análise de créditos com IA e RAG",
  },
} as const

export function EmptyStateCard({ type, onAdd }: EmptyStateCardProps) {
  const isExpense = type === "expense"
  const c = isExpense ? COPY.expense : COPY.service

  return (
    <EmptyStateBox
      title={c.title}
      description={c.description}
      ctaLabel={c.cta}
      shortcutKey={isExpense ? SHORTCUT_KEYS.addExpense : SHORTCUT_KEYS.addService}
      onAction={onAdd}
      ariaLabel={c.aria}
      icon={
        isExpense ? (
          <FileSearch className="size-8 text-muted-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
        ) : (
          <ReceiptText className="size-8 text-muted-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
        )
      }
      badge={
        isExpense ? (
          <div
            className={cn(
              "absolute right-4 top-4 flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1",
              "text-xs font-semibold uppercase tracking-tight text-emerald-800 dark:text-emerald-200",
            )}
            aria-hidden
          >
            <Sparkles className="size-2.5 text-emerald-600 dark:text-emerald-400" />
            IA ativa
          </div>
        ) : undefined
      }
    />
  )
}
