"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { ShellContainer } from "@/components/shell/shell-container"
import { TribiaTopNav } from "@/components/shell/tribia-top-nav"

/**
 * Dossié público: sem barra de navegação do app; resto do site mantém o top nav fixo.
 */
export function AppChromeShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPublicReport = pathname === "/report" || pathname?.startsWith("/report/")

  if (isPublicReport) {
    return <div className="flex w-full min-h-0 flex-1 flex-col">{children}</div>
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-14 border-b bg-background/80 backdrop-blur-sm print:hidden">
        <ShellContainer className="flex h-full min-h-0 items-center gap-2">
          <TribiaTopNav />
        </ShellContainer>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pt-14 print:pt-0">{children}</div>
    </>
  )
}
