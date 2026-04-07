"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ShellBreadcrumbItem {
  label: string
  /** Omit on the current page segment */
  href?: string
}

/**
 * Trilho discreto (§8.5): text-xs muted, não compete com o H1.
 */
export function ShellBreadcrumb({
  items,
  className,
}: {
  items: ShellBreadcrumbItem[]
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Localização na aplicação"
      className={cn("flex flex-wrap items-center gap-1 text-xs text-muted-foreground", className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="size-3 shrink-0 opacity-50" aria-hidden />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-medium text-foreground/80")}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
