import type { Metadata } from "next"
import Link from "next/link"
import { Geist, Geist_Mono } from "next/font/google"
import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Providers } from "@/components/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "TribIA — Simulador de Reforma Tributária",
  description:
    "Calcule o impacto da transição CBS/IBS para a sua empresa com classificação de créditos por IA (LC 68/2024).",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="pt-BR"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          {/* ── Navbar fixa ───────────────────────────────────────────────── */}
          <header className="fixed inset-x-0 top-0 z-50 h-14 border-b bg-background/80 backdrop-blur-sm">
            <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4">
              {/* Logo mark */}
              <a href="/" className="flex items-center gap-2 select-none">
                <span className="font-mono text-lg font-bold text-primary tracking-tight">
                  ◈ TribIA
                </span>
              </a>

              {/* Badges de contexto + auth */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                  LC 68/2024
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  CBS · IBS · IS
                </span>

                {/* Botão de login — visível apenas para visitantes não autenticados */}
                <Show when="signed-out">
                  <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <button className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                      Entrar
                    </button>
                  </SignInButton>
                </Show>

                {/* Links + avatar — visíveis apenas para autenticados */}
                <Show when="signed-in">
                  <Link
                    href="/dashboard/companies"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Empresas
                  </Link>
                  <Link
                    href="/dashboard/history"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Histórico
                  </Link>
                  <UserButton />
                </Show>
              </div>
            </div>
          </header>

          {/* Compensa a altura da navbar */}
          <div className="pt-14 flex flex-col flex-1">
            <Providers>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </Providers>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}
