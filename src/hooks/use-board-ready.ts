"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Modo apresentação: classe `board-ready` em `document.documentElement` para variantes Tailwind
 * `board-ready:*` em toda a árvore (e limpeza ao desligar ou ao desmontar).
 */
export function useBoardReady() {
  const [isBoardReady, setIsBoardReady] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (isBoardReady) {
      root.classList.add("board-ready")
    } else {
      root.classList.remove("board-ready")
    }
    return () => {
      root.classList.remove("board-ready")
    }
  }, [isBoardReady])

  const toggleBoardReady = useCallback(() => {
    setIsBoardReady((v) => !v)
  }, [])

  const exitBoardReady = useCallback(() => {
    setIsBoardReady(false)
  }, [])

  return { isBoardReady, setIsBoardReady, toggleBoardReady, exitBoardReady }
}
