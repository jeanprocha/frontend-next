"use client"

import type { ReactNode } from "react"
import type { SimulationRecordSummary } from "@/types/api"

export interface HistoryRowHoverPreviewProps {
  row: SimulationRecordSummary
  historyPro: boolean
  touchMeeting: boolean
  isThisLoading: boolean
  onOpenInSimulator: () => void | Promise<void>
  children: ReactNode
}

/**
 * Wrapper de linha no histórico. O popover Time-Traveler **não** abre por hover
 * (evita abertura acidental); use o botão «i» (`HistoryRecordPreviewTrigger`).
 */
export function HistoryRowHoverPreview(props: HistoryRowHoverPreviewProps) {
  return <>{props.children}</>
}
