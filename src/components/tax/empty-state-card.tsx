"use client"

import { FileSearch, Plus, ReceiptText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateCardProps {
  type: "service" | "expense"
  onAdd: () => void
}

export function EmptyStateCard({ type, onAdd }: EmptyStateCardProps) {
  const isExpense = type === "expense"
  const ariaLabel = isExpense
    ? "Adicionar primeira despesa para análise de créditos"
    : "Adicionar primeiro serviço ou receita"

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all sm:p-12",
        "border-slate-200 bg-slate-50/50 hover:border-emerald-500/40 hover:bg-emerald-50/20",
        "dark:border-slate-600/60 dark:bg-slate-900/30 dark:hover:border-emerald-500/35 dark:hover:bg-emerald-950/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {isExpense && (
        <div
          className="absolute right-4 top-4 flex items-center gap-1.5 rounded-md bg-emerald-100/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-tight text-emerald-800 shadow-inner dark:bg-emerald-950/60 dark:text-emerald-300"
          aria-hidden
        >
          <Sparkles className="size-2.5 text-emerald-600 dark:text-emerald-400" />
          IA ativa
        </div>
      )}

      <div
        className={cn(
          "mb-5 flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-transform duration-200",
          "group-hover:scale-110 group-hover:rotate-3",
          "dark:bg-slate-800 dark:ring-slate-600",
        )}
        aria-hidden
      >
        {isExpense ? (
          <FileSearch className="size-8 text-slate-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
        ) : (
          <ReceiptText className="size-8 text-slate-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
        )}
      </div>

      <div className="max-w-xs space-y-1.5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {isExpense ? "Nenhuma despesa adicionada" : "Sem receitas ou serviços"}
        </h3>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {isExpense
            ? "Adicione gastos operacionais para a IA classificar a elegibilidade de créditos com base na LC 68/2024 (RAG)."
            : "Informe serviços para calcular a incidência de ISS e a transição para IBS/CBS."}
        </p>
      </div>

      <div
        className={cn(
          "mt-7 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-colors",
          "group-hover:bg-emerald-600 dark:bg-slate-100 dark:text-slate-900 dark:group-hover:bg-emerald-500 dark:group-hover:text-white",
        )}
      >
        <Plus className="size-3.5 shrink-0" aria-hidden />
        {isExpense ? "Adicionar despesa" : "Adicionar receita"}
      </div>
    </button>
  )
}
