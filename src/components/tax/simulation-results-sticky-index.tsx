"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

/** IDs semânticos da página de resultados — contrato único para scroll, hash e testes. */
export const SIMULATION_RESULTS_ANCHORS = {
  contexto: "tribia-resultado-contexto",
  veredito: "veredito-executivo",
  cronograma: "tribia-journey-transicao",
  auditoria: "tribia-dossie-auditoria",
  mesa: "tribia-mesa-operacoes",
} as const

export type SimulationResultsAnchorKey = keyof typeof SIMULATION_RESULTS_ANCHORS

const ITEMS: { key: SimulationResultsAnchorKey; label: string; step: number }[] = [
  { key: "contexto", label: "Contexto", step: 1 },
  { key: "veredito", label: "Veredito", step: 2 },
  { key: "cronograma", label: "Cronograma", step: 3 },
  { key: "auditoria", label: "Auditoria", step: 4 },
  { key: "mesa", label: "Mesa de Operações", step: 5 },
]

interface SimulationResultsStickyIndexProps {
  className?: string
  /**
   * Quando true: o <nav> é filho do SimulationResultsDossierStickyChrome.
   * Remove as classes sticky/bg/blur próprias (o chrome externo fornece-as)
   * para evitar duplicação de camadas e colisão de offsets.
   */
  embedded?: boolean
}

/**
 * Índice de navegação whisper-quiet para o dossiê de resultados.
 * Intersection Observer rastreia a secção mais visível e destaca com emerald.
 * Oculto em Board-Ready e impressão.
 *
 * Modo standalone (padrão): própria camada sticky top-14.
 * Modo embedded: filho de SimulationResultsDossierStickyChrome; sem sticky próprio.
 */
export function SimulationResultsStickyIndex({ className, embedded = false }: SimulationResultsStickyIndexProps) {
  const [activeKey, setActiveKey] = useState<SimulationResultsAnchorKey>("contexto")
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (typeof window === "undefined") return

    const anchorIds = Object.values(SIMULATION_RESULTS_ANCHORS)
    const keyMap = new Map(
      (Object.entries(SIMULATION_RESULTS_ANCHORS) as [SimulationResultsAnchorKey, string][]).map(
        ([k, v]) => [v, k],
      ),
    )
    const intersecting = new Set<string>()

    const pickActive = () => {
      // Primeira secção em ordem de documento que está a intersectar a janela de detecção.
      for (const id of anchorIds) {
        if (intersecting.has(id)) {
          const key = keyMap.get(id)
          if (key) setActiveKey(key)
          return
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target.id)
          else intersecting.delete(entry.target.id)
        }
        pickActive()
      },
      // rootMargin: topo -80px (navbar 56px + margem), fundo -40% (zona de leitura activa).
      { rootMargin: "-80px 0px -40% 0px", threshold: 0 },
    )

    const els = anchorIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    els.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const handleClick = (key: SimulationResultsAnchorKey, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById(SIMULATION_RESULTS_ANCHORS[key])
    el?.scrollIntoView({ behavior: shouldReduceMotion ? "instant" : "smooth", block: "start" })
  }

  return (
    <nav
      aria-label="Navegação do dossiê de resultados"
      className={cn(
        // Standalone: própria camada sticky; embedded: chrome externo fornece estas propriedades
        !embedded && "sticky top-14 z-10",
        !embedded && "-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
        !embedded && "border-b border-border/60 bg-background/90 backdrop-blur-sm",
        "print:hidden board-ready:hidden",
        className,
      )}
    >
      <ol
        className="flex items-center gap-0.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {ITEMS.map(({ key, label, step }) => {
          const isActive = activeKey === key
          return (
            <li key={key}>
              <a
                href={`#${SIMULATION_RESULTS_ANCHORS[key]}`}
                onClick={(e) => handleClick(key, e)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "tribia-touch-target inline-flex min-h-[2.25rem] items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
                  isActive
                    ? "border border-emerald-500/30 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-950/60 dark:text-emerald-100"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold tabular-nums transition-colors duration-150",
                    isActive
                      ? "bg-emerald-600 text-white dark:bg-emerald-500"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {step}
                </span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{step}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
