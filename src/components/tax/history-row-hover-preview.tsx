"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { HistoryTimeTravelerPreviewBody } from "@/components/tax/history-time-traveler-preview-body"
import type { SimulationRecordSummary } from "@/types/api"

const HOVER_OPEN_MS = 420

export interface HistoryRowHoverPreviewProps {
  row: SimulationRecordSummary
  historyPro: boolean
  touchMeeting: boolean
  isThisLoading: boolean
  onOpenInSimulator: () => void | Promise<void>
  children: ReactNode
}

/**
 * Desktop Pro: popover com delay ao pairar na linha (Time-Traveler).
 * Touch / Free: apenas repassa children.
 */
export function HistoryRowHoverPreview({
  row,
  historyPro,
  touchMeeting,
  isThisLoading,
  onOpenInSimulator,
  children,
}: HistoryRowHoverPreviewProps) {
  const [open, setOpen] = useState(false)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  useEffect(
    () => () => {
      clearOpenTimer()
      clearCloseTimer()
    },
    [clearOpenTimer, clearCloseTimer],
  )

  const onRowEnter = useCallback(() => {
    if (!historyPro || touchMeeting) return
    clearCloseTimer()
    clearOpenTimer()
    openTimerRef.current = setTimeout(() => setOpen(true), HOVER_OPEN_MS)
  }, [historyPro, touchMeeting, clearOpenTimer, clearCloseTimer])

  const onRowLeave = useCallback(() => {
    clearOpenTimer()
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), 160)
  }, [clearOpenTimer, clearCloseTimer])

  const onContentEnter = useCallback(() => {
    clearCloseTimer()
    setOpen(true)
  }, [clearCloseTimer])

  const onContentLeave = useCallback(() => {
    clearOpenTimer()
    setOpen(false)
  }, [clearOpenTimer])

  if (!historyPro || touchMeeting) {
    return <>{children}</>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="min-w-0 flex-1 flex" onMouseEnter={onRowEnter} onMouseLeave={onRowLeave}>
          {children}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="right"
        sideOffset={10}
        className="w-[min(100vw-2rem,20rem)] p-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={onContentEnter}
        onMouseLeave={onContentLeave}
      >
        <HistoryTimeTravelerPreviewBody
          row={row}
          isThisLoading={isThisLoading}
          onOpenInSimulator={onOpenInSimulator}
          variant="pro"
          onDismiss={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
