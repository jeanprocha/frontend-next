import type { Metadata } from "next"
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ShellContainer } from "@/components/shell/shell-container"
import { TribiaTopNav } from "@/components/shell/tribia-top-nav"
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
    "Calcule o impacto da transição CBS/IBS para a sua empresa com classificação de créditos por IA (LC 68/2024).",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="pt-BR"
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <Providers>
            <TooltipProvider>
              {/* ── Navbar fixa (dentro de Providers: PLG meter usa React Query) ── */}
              <header className="fixed inset-x-0 top-0 z-50 h-14 border-b bg-background/80 backdrop-blur-sm print:hidden">
                <ShellContainer className="flex h-full min-h-0 items-center gap-2">
                  <TribiaTopNav />
                </ShellContainer>
              </header>

              <div className="pt-14 print:pt-0 flex flex-col flex-1">{children}</div>
            </TooltipProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
