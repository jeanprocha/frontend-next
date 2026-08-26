"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { HistoryTimeTravelerPreviewBody } from "./history-time-traveler-preview-body"
import { useTouchMeetingMode } from "@/hooks/use-touch-meeting-mode"
import { cn } from "@/lib/utils"
import type { SimulationRecordSummary } from "@/types/api"

export interface HistoryRecordPreviewTriggerProps {
  row: SimulationRecordSummary
  isThisLoading: boolean
  onOpenInSimulator: () => void | Promise<void>
  historyPro: boolean
}

export function HistoryRecordPreviewTrigger({
  row,
  isThisLoading,
  onOpenInSimulator,
  historyPro,
}: HistoryRecordPreviewTriggerProps) {
  const touchMeeting = useTouchMeetingMode()
  const [open, setOpen] = useState(false)

  const triggerClass = cn(
    "shrink-0 self-stretch sm:self-center",
    touchMeeting ? "tribia-touch-target min-h-14 w-11 sm:min-h-10 sm:w-10" : "h-auto min-h-14 w-10",
  )

  const variant = historyPro ? "pro" : "free-tease"

  if (touchMeeting) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={triggerClass}
          disabled={isThisLoading}
          aria-label="Pré-visualizar impacto desta simulação"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Info className="h-4 w-4" aria-hidden />
        </Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl max-h-[min(88vh,560px)] overflow-y-auto"
            showCloseButton
          >
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-base font-medium">Pré-visualização</SheetTitle>
            </SheetHeader>
            <HistoryTimeTravelerPreviewBody
              row={row}
              isThisLoading={isThisLoading}
              onOpenInSimulator={onOpenInSimulator}
              variant={variant}
              onDismiss={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={triggerClass}
          disabled={isThisLoading}
          aria-label={
            historyPro
              ? "Pré-visualizar impacto desta simulação"
              : "Pré-visualização — disponível no plano Pro"
          }
        >
          <Info className="h-4 w-4" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] p-4">
        <HistoryTimeTravelerPreviewBody
          row={row}
          isThisLoading={isThisLoading}
          onOpenInSimulator={onOpenInSimulator}
          variant={variant}
          onDismiss={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
