"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { usePlgQuota } from "@/hooks/use-plg-quota"
import { useTribiaPlgTier } from "@/hooks/use-tribia-plg-tier"
import { PlgUpgradeDialog } from "@/components/tribia/plg-upgrade-dialog"

/**
 * Medidor subtil de simulações/dia (Free) na top bar — estado âmbar + Unlock Pro ao esgotar.
 */
export function PlgLimitMeter() {
  const { isSignedIn, isLoaded } = useAuth()
  const tier = useTribiaPlgTier()
  const { data, isError, isFetching } = usePlgQuota()
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  if (!isLoaded || !isSignedIn) return null
  if (tier !== "free") return null
  if (isError || !data) return null
  if (!data.enforcement_enabled || data.daily_limit <= 0) return null

  const used = data.simulations_today
  const limit = data.daily_limit
  const exhausted = used >= limit
  const remaining = Math.max(0, limit - used)
  /** Últimos ~33% do quota (mín. 1 slot): aviso sem punir uso baixo. */
  const nearQuotaEnd =
    !exhausted && remaining <= Math.max(1, Math.ceil(limit / 3))

  const tone = exhausted ? "amber" : nearQuotaEnd ? "warning" : "muted"

  return (
    <>
      <PlgUpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature="generic"
      />
      <div
        className={cn(
          "hidden sm:flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
          tone === "muted" &&
            "border-border/60 bg-muted/40 text-muted-foreground",
          tone === "warning" &&
            "border-amber-500/30 bg-amber-500/[0.07] text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
          tone === "amber" &&
            "border-amber-500/40 bg-amber-500/12 text-amber-950 dark:text-amber-100",
        )}
        title="Limite de simulações no plano Free (ambiente com TRIBIA_PLG_ENFORCE)"
      >
        <span>
          Simulações hoje: {used}/{limit}
        </span>
        {exhausted && (
          <button
            type="button"
            className="rounded-md bg-foreground/10 px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-foreground/15"
            onClick={() => setUpgradeOpen(true)}
          >
            Unlock Pro
          </button>
        )}
        {isFetching ? <span className="opacity-50">…</span> : null}
      </div>
    </>
  )
}
