"use client"

import { useEffect, useState } from "react"

/**
 * «Meeting mode» (plano 08): hover pouco fiável — usar affordances explícitas, Sheet inferior, alvos ≥44px.
 * Combina (hover: none) OU (pointer: coarse), alinhado à visão UX §10.
 */
export function useTouchMeetingMode(): boolean {
  const [meeting, setMeeting] = useState(false)

  useEffect(() => {
    const mqHover = window.matchMedia("(hover: none)")
    const mqPointer = window.matchMedia("(pointer: coarse)")
    const sync = () => setMeeting(mqHover.matches || mqPointer.matches)
    sync()
    mqHover.addEventListener("change", sync)
    mqPointer.addEventListener("change", sync)
    return () => {
      mqHover.removeEventListener("change", sync)
      mqPointer.removeEventListener("change", sync)
    }
  }, [])

  return meeting
}
