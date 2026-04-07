import type { ReactNode } from "react"

import { SHELL_INNER_CLASS } from "@/lib/shell-layout"
import { cn } from "@/lib/utils"

/** Container único `max-w-7xl` + padding horizontal — navbar e páginas autenticadas (Plano 01). */
export function ShellContainer({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <div className={cn(SHELL_INNER_CLASS, className)}>{children}</div>
}
