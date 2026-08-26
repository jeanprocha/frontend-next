"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, SignInButton, UserButton } from "@/lib/auth-client"
import { Menu } from "lucide-react"
// eslint-disable-next-line no-restricted-imports -- herança FE-0: shell→components/tax; resolver na FE-2
import { LegalVersionIndicator } from "@/components/tax/legal-version-indicator"
import { PlgLimitMeter } from "@/components/tribia/plg-limit-meter"
import { TribiaPlanBadge } from "@/components/tribia/tribia-plan-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NAV_LINK_LABELS } from "@/constants/shortcuts"
import { cn } from "@/lib/utils"

type NavKey = "simulator" | "companies" | "history"

function navActive(pathname: string, key: NavKey): boolean {
  if (key === "simulator") {
    return pathname === "/dashboard" || pathname === "/dashboard/"
  }
  if (key === "companies") return pathname.startsWith("/dashboard/companies")
  return pathname.startsWith("/dashboard/history")
}

function navLinkClass(active: boolean) {
  return cn(
    "tribia-touch-target inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "border-border/60 bg-muted/90 text-foreground"
      : "border-transparent text-foreground hover:bg-muted",
  )
}

export function TribiaTopNav() {
  const pathname = usePathname()
  const { isSignedIn, isLoaded } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const logoHref = isLoaded && isSignedIn ? "/dashboard" : "/"
  const logoAria =
    isLoaded && isSignedIn
      ? "TribIA — ir para o simulador"
      : "TribIA — início"

  const simActive = navActive(pathname, "simulator")
  const coActive = navActive(pathname, "companies")
  const hiActive = navActive(pathname, "history")

  return (
    <div className="flex h-full w-full min-w-0 items-center justify-between gap-2">
      <Link
        href={logoHref}
        className="flex shrink-0 items-center gap-2 select-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={logoAria}
      >
        <span className="font-mono text-lg font-bold text-primary tracking-tight">
          ◈ TribIA
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        {isLoaded && isSignedIn ? (
          <>
            <nav
              aria-label="Navegação principal"
              className="flex items-center gap-1 shrink-0"
            >
              <Link
                href="/dashboard"
                className={navLinkClass(simActive)}
                aria-current={simActive ? "page" : undefined}
              >
                {NAV_LINK_LABELS.simulator}
              </Link>
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  href="/dashboard/companies"
                  className={navLinkClass(coActive)}
                  aria-current={coActive ? "page" : undefined}
                >
                  {NAV_LINK_LABELS.companies}
                </Link>
                <Link
                  href="/dashboard/history"
                  className={navLinkClass(hiActive)}
                  aria-current={hiActive ? "page" : undefined}
                >
                  {NAV_LINK_LABELS.history}
                </Link>
              </div>
              <div className="md:hidden">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="tribia-touch-target size-11 shrink-0"
                        aria-label="Abrir menu de navegação"
                      />
                    }
                  >
                    <Menu className="size-5" aria-hidden />
                  </SheetTrigger>
                  <SheetContent side="right" className="gap-0">
                    <SheetHeader className="border-b border-border/60 text-left">
                      <SheetTitle>Navegação</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-1 p-4">
                      <Link
                        href="/dashboard/companies"
                        className={cn(navLinkClass(coActive), "w-full justify-start")}
                        aria-current={coActive ? "page" : undefined}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        {NAV_LINK_LABELS.companies}
                      </Link>
                      <Link
                        href="/dashboard/history"
                        className={cn(navLinkClass(hiActive), "w-full justify-start")}
                        aria-current={hiActive ? "page" : undefined}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        {NAV_LINK_LABELS.history}
                      </Link>
                      <Link
                        href="/privacidade"
                        className={cn(navLinkClass(false), "w-full justify-start")}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        Privacidade e dados
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </nav>
            <span
              className="h-6 w-px shrink-0 bg-border/60"
              aria-hidden
            />
          </>
        ) : null}

        <PlgLimitMeter />
        <LegalVersionIndicator />
        <span className="hidden sm:inline-flex shrink-0 items-center rounded-full border border-border/80 bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          CBS · IBS · IS
        </span>
        <Link
          href="/privacidade"
          className="hidden shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:inline"
        >
          Privacidade e dados
        </Link>
        <TribiaPlanBadge />

        {!isLoaded ? (
          <span
            className="inline-flex h-8 w-8 shrink-0 rounded-full bg-muted animate-pulse"
            aria-hidden
          />
        ) : isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
            <button
              type="button"
              className="tribia-touch-target rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Entrar
            </button>
          </SignInButton>
        )}
      </div>
    </div>
  )
}
