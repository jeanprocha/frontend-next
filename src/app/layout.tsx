import type { Metadata } from "next"
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { AppChromeShell } from "@/components/shell/app-chrome-shell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Providers } from "@/components/providers"
import { E2E_AUTH_BYPASS } from "@/lib/e2e-auth-bypass"
import { LegalVersionIndicator } from "@/features/legal-corpus"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

/** Serif só para narrativa Board-Ready / impressão (Plano 10); variável disponível, uso via `.font-board-report`. */
const sourceSerif4 = Source_Serif_4({
  variable: "--font-board-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "TribIA — Simulador de Reforma Tributária",
  description:
    "Calcule o impacto da transição CBS/IBS para a sua empresa com classificação de créditos por IA.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const app = (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <TooltipProvider>
            <AppChromeShell legalIndicatorSlot={<LegalVersionIndicator />}>{children}</AppChromeShell>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  )

  // Sob o bypass E2E (FE-0), o app renderiza sem ClerkProvider — sem chaves
  // Clerk ele lançaria na renderização. Morto em produção: ver e2e-auth-bypass.ts.
  if (E2E_AUTH_BYPASS) return app

  return <ClerkProvider>{app}</ClerkProvider>
}
