"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { SimulationResultsStickyIndex } from "@/components/tax/simulation-results-sticky-index"
import { SimulationSessionAuthorityStamp } from "@/components/tax/simulation-session-authority-stamp"

export interface SimulationResultsDossierStickyChromeProps {
  sessionCompanyLabel: string
  sessionScenarioLabel: string
  /**
   * Slot opcional: linha de toolbar entre o carimbo e o índice de navegação.
   * Composta pelo SimulationResultsTopDown com o placeholder 1.2.2 (Visão única/A/B)
   * e o CTA Board-Ready (item 1.2.3). Omitir quando não houver resultado form.
   */
  toolbarSlot?: React.ReactNode
  className?: string
}

/**
 * Chrome sticky único do dossiê de resultados Top-Down.
 *
 * Fica imediatamente abaixo da navbar global (top-14 z-10) e agrupa:
 *  1. Carimbo de autoridade de sessão (Empresa / Cenário) — item 1.2.1
 *  2. Toolbar opcional: placeholder 1.2.2 + CTA Board-Ready — item 1.2.3
 *  3. Divisória ultra-fina
 *  4. Índice de navegação entre as 5 secções
 *
 * Oculto em Board-Ready e impressão — essas superfícies têm cabeçalhos próprios.
 * Em Board-Ready, o utilizador sai via o botão «Modo edição» que permanece
 * no header da página (saída de emergência fora do chrome).
 *
 * Stuck observer: sombra elevada só quando há scroll (regra «um só herói»).
 */
export function SimulationResultsDossierStickyChrome({
  sessionCompanyLabel,
  sessionScenarioLabel,
  toolbarSlot,
  className,
}: SimulationResultsDossierStickyChromeProps) {
  const [isStuck, setIsStuck] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setIsStuck(window.scrollY > 4)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={cn(
        "sticky top-14 z-10",
        "-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
        "border-b border-border/50 bg-background/80 backdrop-blur-md",
        "print:hidden board-ready:hidden",
        isStuck && "tribia-shadow-elevated",
        !shouldReduceMotion && "transition-[box-shadow] duration-150",
        className,
      )}
    >
      {/* Carimbo: empresa + cenário (item 1.2.1) */}
      <SimulationSessionAuthorityStamp
        sessionCompanyLabel={sessionCompanyLabel}
        sessionScenarioLabel={sessionScenarioLabel}
      />

      {/* Toolbar: placeholder 1.2.2 + CTA Board-Ready 1.2.3 */}
      {toolbarSlot && (
        <>
          <div aria-hidden className="h-px bg-border/25" />
          <div className="py-1.5">{toolbarSlot}</div>
        </>
      )}

      {/* Linha divisória antes do índice */}
      <div aria-hidden className="h-px bg-border/30" />

      {/* Índice em modo embedded: sem sticky/bg/blur próprios */}
      <SimulationResultsStickyIndex embedded />
    </div>
  )
}
