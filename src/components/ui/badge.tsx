import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        /**
         * Selos do Veredito Financeiro (Institucional Moderno — system.md).
         *
         * Fundo sutil bg/10 + texto sólido + borda /20: transmitem estado de
         * auditoria, não erro de sistema nem "candy" decorativo.
         * O contraste nunca depende só da cor — ícone Shield + rótulo textual
         * garantem leitura sem cor (WCAG + a11y).
         */
        verdictEconomy:
          "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 print:bg-transparent print:border-emerald-700 print:text-emerald-800",
        verdictIncrease:
          "bg-red-500/10 text-red-900 border-red-700/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 print:bg-transparent print:border-red-800 print:text-red-900",
        verdictNeutral:
          "bg-slate-500/10 text-slate-600 border-slate-400/20 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20 print:bg-transparent print:border-slate-500 print:text-slate-600",
        /**
         * Chip de identidade "Ano de foco" (Institucional Moderno — sempre
         * escuro, ver `tribia-navy-hero` no system.md). Fundo sólido em vez
         * de bg/10: não é um estado semântico (economia/aumento), é o
         * carimbo do ano — precisa destacar-se dos selos de polaridade.
         */
        verdictFocusYear:
          "bg-tribia-navy-hero text-white border-transparent dark:bg-tribia-navy-hero dark:text-white print:bg-transparent print:border-foreground print:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
