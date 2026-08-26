"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Shield, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PRIVACY_TRUST_BANNER_DISMISSED_KEY } from "@/store/useTaxStore"
import type { TribiaPlgTier } from "@/lib/tribia-plg-flags"
import { cn } from "@/lib/utils"

const BANNER_MESSAGE =
  "Ambiente de Trabalho Profissional: Os seus dados financeiros e simulações são confidenciais e NÃO são utilizados para treinar modelos de IA."

type PrivacyTrustBannerProps = {
  plgTier: TribiaPlgTier
  className?: string
}

/**
 * Faixa de confiança PRO/Premium: promessa alinhada a `/privacidade` (Pilar 3.6).
 */
export function PrivacyTrustBanner({ plgTier, className }: PrivacyTrustBannerProps) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const isProOrPremium = plgTier !== "free"

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (localStorage.getItem(PRIVACY_TRUST_BANNER_DISMISSED_KEY) === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- herança FE-0: dívida pré-existente (regra nova do eslint-config-next 16.2.2); resolver ao tocar este arquivo
        setDismissed(true)
      }
    } catch {
      /* private mode / indisponível */
    }
    setReady(true)
  }, [])

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(PRIVACY_TRUST_BANNER_DISMISSED_KEY, "1")
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }, [])

  if (!isProOrPremium || !ready || dismissed) {
    return null
  }

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3 print:hidden",
        "shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0 sm:items-center sm:gap-3">
        <Shield
          className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400/90"
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground/95 sm:text-sm">
          <span className="font-medium text-foreground">{BANNER_MESSAGE}</span>{" "}
          <Link
            href="/privacidade"
            className="whitespace-nowrap text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300/95"
          >
            Saber mais
          </Link>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="tribia-touch-target -my-0.5 size-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Fechar aviso de privacidade e confidencialidade"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
