"use client"

import { AlertTriangle, Info, ShieldCheck, Trash2, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type ExpenseFiscalStatus = "eligible" | "risk" | "neutral"

interface TransactionRowBase {
  id: string
  description: string
  amount: string
  onDescriptionChange: (value: string) => void
  onAmountChange: (value: string) => void
  onRemove: () => void
  removeDisabled?: boolean
  /** Etapa N/PR 7 (fato 9) — realça a linha que `validateSimulationLines` recusou. */
  invalid?: boolean
}

interface ServiceRowProps extends TransactionRowBase {
  variant: "service"
  issRate: string
  onIssRateChange: (value: string) => void
}

interface ExpenseRowProps extends TransactionRowBase {
  variant: "expense"
  /** Pré-IA: usar `neutral`. Pós-classificação (futuro): `eligible` | `risk`. */
  fiscalStatus?: ExpenseFiscalStatus
}

export type TransactionRowProps = ServiceRowProps | ExpenseRowProps

const ghostInput =
  "h-7 border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"

/** Labels visíveis ao focar qualquer campo da linha; permanecem no DOM para leitores de ecrã. */
const contextualLabel =
  "block min-h-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground opacity-0 transition-opacity duration-150 motion-reduce:transition-none group-focus-within/row:opacity-100"

function expenseFiscalShell(status: ExpenseFiscalStatus) {
  switch (status) {
    case "eligible":
      return {
        bar: "border-l-emerald-500 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08]",
        iconBox:
          "bg-emerald-50 text-emerald-600 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-800/50",
        icon: "eligible" as const,
      }
    case "risk":
      return {
        bar: "border-l-amber-500 bg-amber-500/[0.06] dark:bg-amber-500/[0.08]",
        iconBox:
          "bg-amber-50 text-amber-600 ring-amber-200/80 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-800/50",
        icon: "risk" as const,
      }
    default:
      return {
        bar: "border-l-border bg-muted/15 dark:bg-muted/20",
        iconBox:
          "bg-muted/40 text-muted-foreground ring-border dark:bg-muted/50 dark:ring-border",
        icon: "neutral" as const,
      }
  }
}

export function TransactionRow(props: TransactionRowProps) {
  const {
    id,
    variant,
    description,
    amount,
    onDescriptionChange,
    onAmountChange,
    onRemove,
    removeDisabled,
    invalid,
  } = props

  const fiscalStatus: ExpenseFiscalStatus =
    props.variant === "expense" ? (props.fiscalStatus ?? "neutral") : "neutral"

  const shell =
    variant === "service"
      ? {
          bar: "border-l-border bg-muted/15 dark:bg-muted/20",
          iconBox:
            "bg-blue-50 text-blue-600 ring-blue-200/70 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900/50",
          icon: "service" as const,
        }
      : expenseFiscalShell(fiscalStatus)

  const descId = `${id}-description`
  const amountId = `${id}-amount`
  const issId = `${id}-iss`
  const invalidAlertId = `${id}-invalid-alert`

  return (
    <div
      className={cn(
        "group/row relative border-y border-r border-border transition-colors duration-150 motion-reduce:transition-none",
        "rounded-r-2xl border-l pl-4 pr-3 py-4 sm:pl-5 sm:pr-4",
        shell.bar,
        "hover:border-border hover:bg-card/80 hover:shadow-sm dark:hover:bg-card/60",
        invalid && "border-l-destructive bg-destructive/[0.05] dark:bg-destructive/[0.08]",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-transform duration-150 motion-reduce:transition-none lg:size-11",
            "group-hover/row:scale-[1.02] motion-reduce:group-hover/row:scale-100",
            shell.iconBox,
          )}
          aria-hidden
        >
          {shell.icon === "service" && <ShieldCheck className="size-[18px] shrink-0" />}
          {shell.icon === "eligible" && (
            <Zap className="size-[18px] shrink-0 fill-emerald-500 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-300" />
          )}
          {shell.icon === "risk" && (
            <AlertTriangle className="size-[18px] shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          {shell.icon === "neutral" && variant === "expense" && (
            <Info className="size-[18px] shrink-0 opacity-80" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <label htmlFor={descId} className={contextualLabel}>
            {variant === "service" ? "Identificação do serviço" : "Identificação da despesa"}
          </label>
          <Input
            id={descId}
            placeholder={variant === "service" ? "Consultoria, Licença SaaS…" : "AWS, GitHub, Aluguel…"}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            required={variant === "service"}
            className={cn(
              ghostInput,
              "text-sm font-medium text-foreground placeholder:text-muted-foreground/50",
            )}
          />
        </div>

        <div className="w-full space-y-0.5 sm:w-36 lg:w-40">
          <label htmlFor={amountId} className={contextualLabel}>
            Valor (BRL)
          </label>
          <div className="relative flex items-baseline gap-1">
            <span className="pointer-events-none pt-0.5 font-mono text-xs font-medium text-muted-foreground">
              R$
            </span>
            <Input
              id={amountId}
              placeholder="0,00"
              inputMode="decimal"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              required={variant === "service"}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? invalidAlertId : undefined}
              className={cn(
                ghostInput,
                "min-w-0 flex-1 font-mono text-base font-black tabular-nums text-foreground",
                invalid && "text-destructive placeholder:text-destructive/40",
              )}
            />
          </div>
        </div>

        {variant === "service" && (
          <div className="w-full space-y-0.5 sm:w-28 lg:w-24">
            <label htmlFor={issId} className={contextualLabel}>
              Alíq. ISS
            </label>
            <Input
              id={issId}
              placeholder="0,05"
              inputMode="decimal"
              value={props.issRate}
              onChange={(e) => props.onIssRateChange(e.target.value)}
              required
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? invalidAlertId : undefined}
              className={cn(
                ghostInput,
                "font-mono text-sm font-semibold tabular-nums text-foreground",
                invalid && "text-destructive placeholder:text-destructive/40",
              )}
            />
          </div>
        )}

        <div
          className={cn(
            "flex shrink-0 justify-end transition-all duration-150 motion-reduce:transition-none",
            "opacity-100 lg:translate-x-0 lg:opacity-100",
            "lg:opacity-0 lg:translate-x-1 lg:group-hover/row:translate-x-0 lg:group-hover/row:opacity-100",
            "lg:group-focus-within/row:translate-x-0 lg:group-focus-within/row:opacity-100",
            "tribia-row-actions-always-visible",
          )}
        >
          <button
            type="button"
            onClick={onRemove}
            disabled={removeDisabled}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors",
              "hover:bg-destructive/10 hover:text-destructive",
              "disabled:pointer-events-none disabled:opacity-20",
            )}
            aria-label={variant === "service" ? "Remover serviço" : "Remover despesa"}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <span className="sr-only" id={`row-label-${id}`}>
        {variant === "service" ? "Linha de receita" : "Linha de despesa"}
      </span>
      {invalid && (
        <span className="sr-only" id={invalidAlertId} role="alert">
          Linha com valor inválido — revise antes de simular.
        </span>
      )}
    </div>
  )
}
