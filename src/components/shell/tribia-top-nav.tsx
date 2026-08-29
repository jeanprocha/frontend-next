"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth, SignInButton, UserButton } from "@/lib/auth-client"
import { Menu } from "lucide-react"
import { PlgLimitMeter, TribiaPlanBadge } from "@/features/plg"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NAV_LINK_LABELS } from "@/constants/shortcuts"
import { ROTAS, ehRotaClientes, ehRotaSimulacoes, ehSuperficieSimulador } from "@/constants/routes"
import { cn } from "@/lib/utils"

type NavKey = "clientes" | "simulador" | "simulacoes"

function navActive(pathname: string, key: NavKey): boolean {
  if (key === "clientes") return ehRotaClientes(pathname)
  if (key === "simulador") return ehSuperficieSimulador(pathname)
  return ehRotaSimulacoes(pathname)
}

function navLinkClass(active: boolean) {
  return cn(
    "tribia-touch-target inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "border-border/60 bg-muted/90 text-foreground"
      : "border-transparent text-foreground hover:bg-muted",
  )
}

export interface TribiaTopNavProps {
  /**
   * Slot para o indicador de versão legal (features/legal-corpus) — shell/
   * não importa features/ (exceto @/features/plg), então quem monta o
   * elemento é app/layout.tsx (Server Component; o slot é um ReactNode, não
   * uma referência de função — passar isso por prop é suportado).
   */
  legalIndicatorSlot?: ReactNode
}

export function TribiaTopNav({ legalIndicatorSlot }: TribiaTopNavProps) {
  const pathname = usePathname()
  const { isSignedIn, isLoaded } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const logoHref = isLoaded && isSignedIn ? ROTAS.clientes : ROTAS.inicio
  const logoAria =
    isLoaded && isSignedIn
      ? "TribIA — ir para Clientes"
      : "TribIA — início"

  const clientesActive = navActive(pathname, "clientes")
  const simuladorActive = navActive(pathname, "simulador")
  const simulacoesActive = navActive(pathname, "simulacoes")

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
              {/* P0 do re-critique: em 375px este link colidia com o logo —
                  no mobile ele vive dentro do Sheet, como os demais. */}
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  href={ROTAS.clientes}
                  className={navLinkClass(clientesActive)}
                  aria-current={clientesActive ? "page" : undefined}
                >
                  {NAV_LINK_LABELS.clientes}
                </Link>
                <Link
                  href={ROTAS.simulador}
                  className={navLinkClass(simuladorActive)}
                  aria-current={simuladorActive ? "page" : undefined}
                >
                  {NAV_LINK_LABELS.simulador}
                </Link>
                <Link
                  href={ROTAS.simulacoes}
                  className={navLinkClass(simulacoesActive)}
                  aria-current={simulacoesActive ? "page" : undefined}
                >
                  {NAV_LINK_LABELS.simulacoes}
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
                        href={ROTAS.clientes}
                        className={cn(navLinkClass(clientesActive), "w-full justify-start")}
                        aria-current={clientesActive ? "page" : undefined}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        {NAV_LINK_LABELS.clientes}
                      </Link>
                      <Link
                        href={ROTAS.simulador}
                        className={cn(navLinkClass(simuladorActive), "w-full justify-start")}
                        aria-current={simuladorActive ? "page" : undefined}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        {NAV_LINK_LABELS.simulador}
                      </Link>
                      <Link
                        href={ROTAS.simulacoes}
                        className={cn(navLinkClass(simulacoesActive), "w-full justify-start")}
                        aria-current={simulacoesActive ? "page" : undefined}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        {NAV_LINK_LABELS.simulacoes}
                      </Link>
                      <Link
                        href={ROTAS.configuracoes}
                        className={cn(navLinkClass(false), "w-full justify-start")}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        Configurações
                      </Link>
                      <Link
                        href={ROTAS.privacidade}
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
            <Link
              href={ROTAS.configuracoes}
              className="hidden shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline md:inline"
            >
              Configurações
            </Link>
            <span
              className="h-6 w-px shrink-0 bg-border/60"
              aria-hidden
            />
          </>
        ) : null}

        <PlgLimitMeter />
        {legalIndicatorSlot}
        <span className="hidden sm:inline-flex shrink-0 items-center rounded-full border border-border/80 bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          CBS · IBS · IS
        </span>
        <Link
          href={ROTAS.privacidade}
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
          <SignInButton mode="modal" fallbackRedirectUrl={ROTAS.clientes}>
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
