"use client"

import { useCallback, useEffect } from "react"
import { useTaxStore } from "@/store/useTaxStore"

/**
 * Chave estável em sessionStorage — lida/escrita apenas no cliente.
 * Exportada para page.tsx usar na hidratação após montagem (com guardas de tier/resultado).
 */
export const BOARD_READY_SESSION_KEY = "tribia-presentation-mode"

/**
 * Modo apresentação Board-Ready.
 *
 * Aplica/remove a classe `board-ready` em `document.documentElement` (raiz da árvore —
 * equivalente a «classe global no root» do system.md e tribia_core_rules §4).
 *
 * Estado canónico: `presentationMode` no `useTaxStore` (Zustand).
 * Persistência em `sessionStorage` — escrita só no cliente, nunca no servidor (SSR-safe).
 * Hidratação inicial: feita em `useEffect` em page.tsx, com guardas de tier e resultado.
 */
export function useBoardReady() {
  const presentationMode = useTaxStore((s) => s.presentationMode)
  const storeSetter = useTaxStore((s) => s.setPresentationMode)

  // Aplica/remove `board-ready` no <html> — única origem da classe na árvore.
  useEffect(() => {
    const root = document.documentElement
    if (presentationMode) {
      root.classList.add("board-ready")
    } else {
      root.classList.remove("board-ready")
    }
    return () => {
      root.classList.remove("board-ready")
    }
  }, [presentationMode])

  const setIsBoardReady = useCallback(
    (v: boolean) => {
      storeSetter(v)
      try {
        if (v) {
          sessionStorage.setItem(BOARD_READY_SESSION_KEY, "1")
        } else {
          sessionStorage.removeItem(BOARD_READY_SESSION_KEY)
        }
      } catch {
        // sessionStorage pode estar bloqueado (modo privado / iframe sandboxed)
      }
    },
    [storeSetter],
  )

  const toggleBoardReady = useCallback(() => {
    setIsBoardReady(!presentationMode)
  }, [presentationMode, setIsBoardReady])

  const exitBoardReady = useCallback(() => {
    setIsBoardReady(false)
  }, [setIsBoardReady])

  return {
    isBoardReady: presentationMode,
    setIsBoardReady,
    toggleBoardReady,
    exitBoardReady,
  }
}
