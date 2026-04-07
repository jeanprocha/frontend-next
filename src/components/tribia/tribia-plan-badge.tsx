"use client"

import { useAuth } from "@clerk/nextjs"
import { useTribiaPlgTier } from "@/hooks/use-tribia-plg-tier"
import type { TribiaPlgTier } from "@/lib/tribia-plg-flags"
import { cn } from "@/lib/utils"

const LABEL: Record<TribiaPlgTier, string> = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
}

/**
 * Selo de plano na top bar — hierarquia visual alinhada a tokens existentes (sem novo eixo cromático).
 */
export function TribiaPlanBadge() {
  const { isSignedIn, isLoaded } = useAuth()
  const tier = useTribiaPlgTier()

  if (!isLoaded || !isSignedIn) return null

  return (
    <span
      role="status"
      aria-label={`Plano da conta: ${LABEL[tier]}`}
      className={cn(
        "inline-flex max-w-[5.5rem] shrink-0 items-center justify-center truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider tabular-nums sm:max-w-none sm:px-2.5 sm:text-xs",
        tier === "free" &&
          "border-border/80 bg-muted/80 text-muted-foreground",
        tier === "pro" &&
          "border-emerald-500/35 bg-emerald-500/[0.08] text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
        tier === "premium" &&
          "border-primary/45 bg-primary/[0.07] text-foreground",
      )}
    >
      {LABEL[tier]}
    </span>
  )
}
